
const db = require("../config/database");

const transporter = require("../config/email");

const {
    createRFQResponse,
    markEmailAsSent
} = require("../UserService/rfqResponseService");

// =====================================================
// APPLY FOR RFQ
// =====================================================

async function applyForRFQ(req, res) {

    const connection = await db.getConnection();

    try {

        const { rfqId } = req.params;

        const {
            user_id,
            proposal,
            quoted_price
        } = JSON.parse(req.body.data);

        // =================================================
        // VALIDATION
        // =================================================

        if (!rfqId) {

            return res.status(400).json({
                success: false,
                message: "RFQ ID is required"
            });
        }

        if (!user_id) {

            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        if (!proposal) {

            return res.status(400).json({
                success: false,
                message: "Proposal is required"
            });
        }

        if (!quoted_price) {

            return res.status(400).json({
                success: false,
                message: "Quoted price is required"
            });
        }

        // =================================================
        // CHECK DOCUMENT
        // =================================================

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Quotation document is required"
            });
        }

        // =================================================
        // CHECK FILE TYPE
        // =================================================

        if (req.file.mimetype !== "application/pdf") {

            return res.status(400).json({
                success: false,
                message: "Quotation document must be a PDF"
            });
        }

        // =================================================
        // CHECK USER
        // =================================================

        const [users] = await connection.execute(
            `
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                r.role_name
            FROM user u
            INNER JOIN role r
                ON u.role_id = r.role_id
            WHERE u.user_id = ?
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
        // USER MUST BE SMME
        // =================================================

        if (user.role_name !== "SMME") {

            return res.status(403).json({
                success: false,
                message: "Only SMME users can apply for an RFQ"
            });
        }

        // =================================================
        // CHECK RFQ
        // =================================================

        const [rfqs] = await connection.execute(
            `
            SELECT
                rfq_id,
                title,
                description,
                closing_date,
                published_by,
                status
            FROM RFQopportunity
            WHERE rfq_id = ?
            `,
            [rfqId]
        );

        if (rfqs.length === 0) {

            return res.status(404).json({
                success: false,
                message: "RFQ opportunity not found"
            });
        }

        const rfq = rfqs[0];

        // =================================================
        // CHECK RFQ STATUS
        // =================================================

        if (rfq.status !== "OPEN") {

            return res.status(400).json({
                success: false,
                message: "This RFQ is no longer open"
            });
        }

        // =================================================
        // CHECK CLOSING DATE
        // =================================================

        if (
            rfq.closing_date &&
            new Date(rfq.closing_date) < new Date()
        ) {

            return res.status(400).json({
                success: false,
                message: "The RFQ closing date has passed"
            });
        }

        // =================================================
        // CHECK SMME SECTOR MATCH
        // =================================================

        const [sectorMatch] = await connection.execute(
            `
            SELECT
                bm.sector_id,
                s.sector_name
            FROM business_profile bp

            INNER JOIN business_maturity bm
                ON bp.business_id = bm.business_id

            INNER JOIN sector s
                ON bm.sector_id = s.sector_id

            INNER JOIN rfq_sector rs
                ON rs.sector_id = bm.sector_id

            WHERE bp.user_id = ?
              AND rs.rfq_id = ?
            `,
            [
                user_id,
                rfqId
            ]
        );

        if (sectorMatch.length === 0) {

            return res.status(403).json({
                success: false,
                message: "Your business sector does not match this RFQ"
            });
        }

        // =================================================
        // CHECK DUPLICATE APPLICATION
        // =================================================

        const [existingResponse] = await connection.execute(
            `
            SELECT rfq_response_id
            FROM RFQ_response
            WHERE rfq_id = ?
              AND user_id = ?
            `,
            [
                rfqId,
                user_id
            ]
        );

        if (existingResponse.length > 0) {

            return res.status(409).json({
                success: false,
                message: "You have already applied for this RFQ"
            });
        }

        // =================================================
        // START TRANSACTION
        // =================================================

        await connection.beginTransaction();

        // =================================================
        // SAVE RESPONSE
        // =================================================

        console.log("RFQ APPLICATION DATA:");
        console.log("rfqId:", rfqId);
        console.log("user_id:", user_id);
        console.log("proposal:", proposal);
        console.log("quoted_price:", quoted_price);
        console.log("file name:", req.file.originalname);
        console.log("file type:", req.file.mimetype);
        console.log("file size:", req.file.size);

        const responseId = await createRFQResponse(
            connection,
            {
                rfq_id: rfqId,
                user_id,
                proposal,
                quoted_price
            }
        );

        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();

        // =================================================
        // SEND EMAIL TO RFQ PUBLISHER
        // =================================================

        let emailSent = false;

        try {

            // ---------------------------------------------
            // GET RFQ PUBLISHER
            // ---------------------------------------------

            const [publisher] = await connection.execute(
                `
                SELECT
                    email,
                    first_name,
                    last_name
                FROM user
                WHERE user_id = ?
                `,
                [rfq.published_by]
            );

            if (publisher.length > 0) {

                const recipientEmail = publisher[0].email;

                // -----------------------------------------
                // SEND EMAIL WITH PDF ATTACHMENT
                // -----------------------------------------

                await transporter.sendMail({

                    from: process.env.EMAIL_USER,

                    to: recipientEmail,

                    subject:
                        `New RFQ Application - ${rfq.title}`,

                    html: `
                        <h2>New RFQ Application</h2>

                        <p>
                            An SMME has submitted an application
                            for the following RFQ:
                        </p>

                        <p>
                            <strong>RFQ:</strong>
                            ${rfq.title}
                        </p>

                        <hr>

                        <h3>Applicant</h3>

                        <p>
                            <strong>Name:</strong>
                            ${user.first_name}
                            ${user.last_name}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${user.email}
                        </p>

                        <h3>Application</h3>

                        <p>
                            <strong>Proposal:</strong>
                        </p>

                        <p>
                            ${proposal}
                        </p>

                        <p>
                            <strong>Quoted Price:</strong>
                            R ${quoted_price}
                        </p>

                        <p>
                            <strong>Response ID:</strong>
                            ${responseId}
                        </p>

                        <p>
                            The quotation document is attached
                            to this email.
                        </p>
                    `,

                    // -----------------------------------------
                    // PDF ATTACHMENT
                    // -----------------------------------------

                    attachments: [
                        {
                            filename: req.file.originalname,
                            content: req.file.buffer,
                            contentType: req.file.mimetype
                        }
                    ]
                });

                // -----------------------------------------
                // EMAIL SENT SUCCESSFULLY
                // -----------------------------------------

                await markEmailAsSent(
                    connection,
                    responseId
                );

                emailSent = true;

                console.log(
                    "RFQ application email sent to publisher:",
                    recipientEmail
                );
            }

        } catch (emailError) {

            console.error(
                "RFQ application saved but publisher email failed:",
                emailError
            );

            // Application remains saved.
        }

        // =================================================
        // NEW: SEND CONFIRMATION EMAIL TO SMME APPLICANT
        // =================================================

        let applicantEmailSent = false;

        try {

            await transporter.sendMail({

                from: process.env.EMAIL_USER,

                to: user.email,

                subject:
                    `RFQ Application Confirmation - ${rfq.title}`,

                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 650px;
                        margin: auto;
                    ">

                        <h2 style="color: #201E64;">
                            RFQ Application Confirmation
                        </h2>

                        <p>
                            Dear ${user.first_name} ${user.last_name},
                        </p>

                        <p>
                            Thank you for submitting your quotation
                            through the Tongaat Hulett Enterprise
                            and Supplier Development Portal.
                        </p>

                        <p>
                            Your RFQ application has been
                            successfully recorded.
                        </p>

                        <hr>

                        <h3 style="color: #201E64;">
                            Application Details
                        </h3>

                        <p>
                            <strong>RFQ Title:</strong>
                            ${rfq.title}
                        </p>

                        <p>
                            <strong>Application Reference:</strong>
                            ${responseId}
                        </p>

                        <p>
                            <strong>Proposal:</strong>
                            ${proposal}
                        </p>

                        <p>
                            <strong>Quoted Price:</strong>
                            R ${quoted_price}
                        </p>

                        <p>
                            <strong>Application Status:</strong>
                            SUBMITTED
                        </p>

                        <p>
                            <strong>Quotation Document:</strong>
                            ${req.file.originalname}
                        </p>

                        <hr>

                        <p>
                            Your application has been recorded
                            and will be reviewed by the
                            relevant team.
                        </p>

                        <p>
                            You will be contacted if further
                            information is required or when
                            there are updates regarding
                            your application.
                        </p>

                        <p>
                            Please keep your application
                            reference number for future
                            enquiries.
                        </p>

                        <br>

                        <p>
                            Kind regards,<br>
                            <strong>
                                Tongaat Hulett ESD Team
                            </strong>
                        </p>

                    </div>
                `
            });

            applicantEmailSent = true;

            console.log(
                "RFQ confirmation email sent to applicant:",
                user.email
            );

        } catch (applicantEmailError) {

            console.error(
                "RFQ application saved but applicant confirmation email failed:",
                applicantEmailError
            );

            // Application remains saved.
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message: emailSent
                ? "RFQ application submitted and email sent successfully"
                : "RFQ application submitted, but the publisher email could not be sent",

            data: {

                rfq_response_id: responseId,

                rfq_id: rfqId,

                user_id,

                proposal,

                quoted_price,

                quotation_document: {
                    file_name: req.file.originalname,
                    file_type: req.file.mimetype,
                    file_size: req.file.size
                },

                status: "SUBMITTED",

                email_sent: emailSent,

                applicant_email_sent: applicantEmailSent
            }

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "RFQ application error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to submit RFQ application",

            error: error.message
        });

    } finally {

        connection.release();
    }
}

module.exports = {
    applyForRFQ
};
