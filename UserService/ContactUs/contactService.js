
const transporter = require("../../config/email");

// ======================================================
// SEND CONTACT MESSAGE
// ======================================================

const sendContactMessage = async ({
    name,
    email,
    subject,
    message
}) => {

    const supportEmail =
        process.env.CONTACT_EMAIL ||
        "adivhaho@mentecfoundationsa.org";

    // ==================================================
    // EMAIL OPTIONS
    // ==================================================

    const mailOptions = {

        // Gmail account used to send emails
        from: process.env.EMAIL_USER,

        // Support team receives the message
        to: supportEmail,

        // Reply directly to the supplier
        replyTo: {
            name: name,
            address: email
        },

        // Email subject
        subject: `ESD Portal Contact: ${subject}`,

        // Email body
        text: `
New Contact Us Enquiry
Tongaat Hulett ESD Portal

----------------------------------------

Name: ${name}

Email: ${email}

Subject: ${subject}

Message:
${message}

----------------------------------------

This message was submitted through the
Tongaat Hulett ESD Portal Contact Us form.
        `
    };

    // ==================================================
    // SEND EMAIL
    // ==================================================

    const result = await transporter.sendMail(mailOptions);

    return {
        messageId: result.messageId
    };
};

module.exports = {
    sendContactMessage
};
