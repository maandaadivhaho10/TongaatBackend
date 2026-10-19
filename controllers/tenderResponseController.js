const {
    createTenderResponse,
    getResponsesByTender,
    getTenderResponseById
} = require("../UserService/tenderResponseService");
const transporter = require("../config/email");
const db = require("../config/database");

// Keep your existing db, createTenderResponse,
// and transporter imports.

// =====================================================
// CREATE TENDER RESPONSE
// =====================================================

async function createTenderResponseController(req, res) {

    try {

        // =================================================
        // GET USER ID FROM TOKEN
        // =================================================

        const user_id = req.user?.user_id;
        const { tender_id } = req.body;

        // =================================================
        // VALIDATION
        // =================================================

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in access token"
            });
        }

        if (!tender_id) {
            return res.status(400).json({
                success: false,
                message: "tender_id is required"
            });
        }

        // =================================================
        // GET USER DETAILS
        // =================================================

        const [users] = await db.query(
            `
            SELECT
                first_name,
                last_name,
                email
            FROM user
            WHERE user_id = ?
            `,
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = users[0];

        // =================================================
        // CREATE TENDER APPLICATION
        // =================================================

        const responseId = await createTenderResponse({
            tender_id,
            user_id
        });

        // =================================================
        // SEND CONFIRMATION EMAIL
        // =================================================

        let emailSent = false;

        try {

            await transporter.sendMail({

                from: process.env.SMTP_FROM || process.env.SMTP_USER,

                to: user.email,

                subject: "Tender Application Confirmation - Tongaat Hulett",

                text: `
Dear ${user.first_name} ${user.last_name},

Thank you for submitting your tender application through the
Tongaat Hulett Enterprise and Supplier Development Portal.

Your tender application has been successfully received.

Tender ID: ${tender_id}
Application Status: SUBMITTED

Your application will be reviewed by the relevant team.

You will be contacted if further information is required.

Kind regards,
Tongaat Hulett Enterprise and Supplier Development Team
                `.trim()

            });

            emailSent = true;

        } catch (emailError) {

            console.error(
                "Tender confirmation email error:",
                emailError
            );

        }

        // =================================================
        // UPDATE EMAIL STATUS
        // =================================================

        if (emailSent) {

            try {

                await db.query(
                    `
                    UPDATE Tender_response
                    SET email_sent = 1
                    WHERE tender_response_id = ?
                    `,
                    [responseId]
                );

            } catch (updateError) {

                console.error(
                    "Failed to update email status:",
                    updateError
                );

            }
        }

        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message: emailSent
                ? "Tender application submitted successfully. Confirmation email sent."
                : "Tender application submitted successfully, but confirmation email could not be sent.",

            response: {

                tender_response_id: responseId,

                tender_id,

                user_id,

                status: "SUBMITTED",

                email_sent: emailSent

            }

        });

    } catch (error) {

        console.error(
            "Create tender response error:",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "You have already applied for this tender"
            });

        }

        return res.status(500).json({
            success: false,
            message: "Failed to submit tender application",
            error: error.message
        });

    }
}
// =====================================================
// GET RESPONSES FOR TENDER
// =====================================================

async function getResponsesByTenderController(req, res) {

    try {

        const {
            tender_id
        } = req.params;


        const responses =
            await getResponsesByTender(
                tender_id
            );


        return res.status(200).json({

            success: true,

            count: responses.length,

            responses

        });


    } catch (error) {

        console.error(
            "Get tender responses error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch tender responses",

            error: error.message

        });
    }
}


// =====================================================
// GET RESPONSE BY ID
// =====================================================

async function getTenderResponseByIdController(
    req,
    res
) {

    try {

        const {
            tender_response_id
        } = req.params;


        const response =
            await getTenderResponseById(
                tender_response_id
            );


        if (!response) {

            return res.status(404).json({

                success: false,

                message:
                    "Tender response not found"

            });
        }


        return res.status(200).json({

            success: true,

            response

        });


    } catch (error) {

        console.error(
            "Get tender response error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch tender response",

            error: error.message

        });
    }
}


module.exports = {

    createTenderResponseController,

    getResponsesByTenderController,

    getTenderResponseByIdController

};