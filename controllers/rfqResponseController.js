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
        } = req.body;


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
                target_role_id,
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
        // CHECK TARGET ROLE
        // =================================================

        if (rfq.target_role_id !== 2) {

            return res.status(400).json({
                success: false,
                message: "This RFQ is not available to SMMEs"
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
        // SEND EMAIL
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

                const recipientEmail =
                    publisher[0].email;


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
            }

        } catch (emailError) {

            console.error(
                "RFQ application saved but email failed:",
                emailError
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
                : "RFQ application submitted, but the email could not be sent",

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

                email_sent: emailSent
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