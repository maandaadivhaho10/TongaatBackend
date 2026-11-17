
const transporter = require("../../config/email");
const sendPasswordResetEmail = async (email, otp) => {

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password.</p>
            <h1>${otp}</h1>
            <p>This OTP expires in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `
    });
};

module.exports = {
    // Keep your existing exports here
    sendPasswordResetEmail
};