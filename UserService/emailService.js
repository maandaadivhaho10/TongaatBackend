// services/emailService.js

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD
//     }
// });
const transporter = require("../config/email");

async function sendOtpEmail(email, otp) {

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Tongaat Farmer Registration OTP",
        html: `
            <div>
                <h2>Registration Verification</h2>

                <p>Your OTP is:</p>

                <h1>${otp}</h1>

                <p>This OTP will expire in 5 minutes.</p>

                <p>
                    If you did not request this registration,
                    please ignore this email.
                </p>
            </div>
        `
    });
}

module.exports = {
    sendOtpEmail
};