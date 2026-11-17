const db = require("../../config/database");

const {
    requestPasswordReset,
    resetPassword
} = require("../../UserService/PasswordReset/passwordResetService");


// FORGOT PASSWORD
const forgotPassword = async (req, res) => {

    let connection;

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        connection = await db.getConnection();

        await requestPasswordReset(connection, email);

        return res.status(200).json({
            success: true,
            message: "If an account exists with that email, a password reset OTP has been sent."
        });

    } catch (error) {

        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request"
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};


// RESET PASSWORD
const changePassword = async (req, res) => {

    let connection;

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and new password are required"
            });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "OTP must contain 6 digits"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        await resetPassword(
            connection,
            email,
            String(otp),
            newPassword
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error("Reset password error:", error);

        if (error.message === "Invalid or expired OTP") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to reset password"
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    forgotPassword,
    changePassword
};