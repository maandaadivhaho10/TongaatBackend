// controllers/otpController.js

const db = require("../config/database");
const { verifyOtp } = require("../UserService/otpService");

const verifyUserOtp = async (req, res) => {

    const { user_id, otp } = req.body;

    if (!user_id || !otp) {
        return res.status(400).json({
            message: "User ID and OTP are required"
        });
    }

    let connection;

    try {

        connection = await db.getConnection();

        await verifyOtp(
            connection,
            user_id,
            otp
        );

        // Mark user as verified
        await connection.execute(
            `
            UPDATE user
            SET status = 'ACTIVE'
            WHERE user_id = ?
            `,
            [user_id]
        );

        res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (error) {

        console.error("OTP verification error:", error);

        res.status(400).json({
            message: error.message
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    verifyUserOtp
};