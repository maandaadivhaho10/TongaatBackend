
const transporter = require("../config/email");

async function CompanyRegistrationEmail(email) {

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Company Registration Sucessful",
        html: `
            <div>
                <h2> company sucessful registered  </h2>

    
                    If you did not request this registration,
                    please ignore this email.
                </p>
            </div>
        `
    });
}

module.exports = {
    CompanyRegistrationEmail
};