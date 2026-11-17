const bcrypt = require("bcrypt");
const crypto = require("crypto");

const {
    sendPasswordResetEmail
} = require("./emailService");

// Generate a secure 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP before storing it
const hashOTP = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

// REQUEST PASSWORD RESET
const requestPasswordReset = async (connection, email) => {

    const [users] = await connection.query(
        `SELECT user_id, email
         FROM user
         WHERE email = ?`,
        [email]
    );

    // Do not reveal whether the email exists
    if (users.length === 0) {
        return;
    }

    const user = users[0];

    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Invalidate previous unused OTPs
    await connection.query(
        `UPDATE password_reset
         SET used_at = NOW()
         WHERE user_id = ?
         AND used_at IS NULL`,
        [user.user_id]
    );

    // Store the new OTP hash (valid for 10 minutes)
    await connection.query(
        `INSERT INTO password_reset
         (user_id, otp_hash, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [user.user_id, otpHash]
    );

    // Send OTP to user's email
    await sendPasswordResetEmail(user.email, otp);
};


// RESET PASSWORD
const resetPassword = async (
    connection,
    email,
    otp,
    newPassword
) => {

    const [users] = await connection.query(
        `SELECT user_id
         FROM user
         WHERE email = ?`,
        [email]
    );

    if (users.length === 0) {
        throw new Error("Invalid or expired OTP");
    }

    const userId = users[0].user_id;
    const otpHash = hashOTP(otp);

    // Find a valid, unused OTP
    const [records] = await connection.query(
        `SELECT reset_id
         FROM password_reset
         WHERE user_id = ?
         AND otp_hash = ?
         AND expires_at > NOW()
         AND used_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, otpHash]
    );

    if (records.length === 0) {
        throw new Error("Invalid or expired OTP");
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await connection.query(
        `UPDATE user
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );

    // Mark OTP as used
    await connection.query(
        `UPDATE password_reset
         SET used_at = NOW()
         WHERE reset_id = ?`,
        [records[0].reset_id]
    );
};

module.exports = {
    requestPasswordReset,
    resetPassword
};