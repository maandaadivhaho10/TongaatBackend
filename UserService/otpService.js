// services/otpService.js

const bcrypt = require("bcrypt");
const crypto = require("crypto");


// =====================================================
// GENERATE OTP
// =====================================================

function generateOtp() {

    return crypto
        .randomInt(100000, 1000000)
        .toString();
}


// =====================================================
// CREATE OTP
// =====================================================

async function createOtp(connection, userId) {

    const otp = generateOtp();

    const otpHash =
        await bcrypt.hash(otp, 10);


    // =================================================
    // OTP VALID FOR 10 HOURS
    // =================================================

    const expiresAt =
        new Date(
            Date.now() + 10 * 60 * 60 * 1000
        );


    // =================================================
    // INVALIDATE PREVIOUS OTPS
    // =================================================

    await connection.execute(
        `
        UPDATE otp_verification
        SET verified = TRUE
        WHERE user_id = ?
        AND verified = FALSE
        `,
        [userId]
    );


    // =================================================
    // SAVE NEW OTP
    // =================================================

    await connection.execute(
        `
        INSERT INTO otp_verification
        (
            user_id,
            otp_hash,
            expires_at
        )
        VALUES (?, ?, ?)
        `,
        [
            userId,
            otpHash,
            expiresAt
        ]
    );


    // =================================================
    // CONSOLE OTP
    // =================================================

    console.log("====================================");
    console.log("OTP CREATED");
    console.log("User ID:", userId);
    console.log("OTP:", otp);
    console.log("Expires At:", expiresAt);
    console.log("====================================");


    return otp;
}


// =====================================================
// VERIFY OTP
// =====================================================

async function verifyOtp(
    connection,
    userId,
    otp
) {

    // =================================================
    // CONSOLE USER ID AND OTP
    // =================================================

    console.log("====================================");
    console.log("OTP VERIFICATION REQUEST");
    console.log("User ID:", userId);
    console.log("OTP:", otp);
    console.log("====================================");


    const [rows] =
        await connection.execute(
            `
            SELECT *
            FROM otp_verification
            WHERE user_id = ?
            AND verified = FALSE
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [userId]
        );


    // =================================================
    // NO OTP FOUND
    // =================================================

    if (rows.length === 0) {

        console.log(
            "No active OTP found for User ID:",
            userId
        );

        throw new Error(
            "No active OTP found"
        );
    }


    const record = rows[0];


    // =================================================
    // CHECK EXPIRATION
    // =================================================

    if (
        new Date(record.expires_at)
        < new Date()
    ) {

        console.log(
            "OTP expired for User ID:",
            userId
        );

        throw new Error(
            "OTP has expired"
        );
    }


    // =================================================
    // LIMIT ATTEMPTS
    // =================================================

    if (record.attempts >= 5) {

        console.log(
            "Too many OTP attempts for User ID:",
            userId
        );

        throw new Error(
            "Too many OTP attempts"
        );
    }


    // =================================================
    // COMPARE OTP
    // =================================================

    const valid =
        await bcrypt.compare(
            otp,
            record.otp_hash
        );


    // =================================================
    // INVALID OTP
    // =================================================

    if (!valid) {

        console.log(
            "Invalid OTP for User ID:",
            userId
        );

        await connection.execute(
            `
            UPDATE otp_verification
            SET attempts = attempts + 1
            WHERE otp_id = ?
            `,
            [record.otp_id]
        );

        throw new Error(
            "Invalid OTP"
        );
    }


    // =================================================
    // OTP VERIFIED
    // =================================================

    await connection.execute(
        `
        UPDATE otp_verification
        SET verified = TRUE
        WHERE otp_id = ?
        `,
        [record.otp_id]
    );


    console.log("====================================");
    console.log("OTP VERIFIED SUCCESSFULLY");
    console.log("User ID:", userId);
    console.log("OTP:", otp);
    console.log("====================================");


    return true;
}


module.exports = {
    createOtp,
    verifyOtp
};