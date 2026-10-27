
const {
    sendContactMessage
} = require("../../UserService/ContactUs/contactService");

// ======================================================
// SUBMIT CONTACT FORM
// ======================================================

const submitContactForm = async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message
        } = req.body || {};

        // Validate required fields
        if (
            [name, email, subject, message].some(
                value =>
                    typeof value !== "string" ||
                    !value.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate email format
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Validate lengths
        if (
            name.trim().length > 100 ||
            email.trim().length > 254 ||
            subject.trim().length > 200 ||
            message.trim().length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length"
            });
        }

        // Send email
        await sendContactMessage({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        return res.status(200).json({
            success: true,
            message:
                "Your message has been sent successfully. Our support team will get back to you."
        });

    } catch (error) {

        console.error(
            "Contact form error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send your message. Please try again later."
        });
    }
};

module.exports = {
    submitContactForm
};
