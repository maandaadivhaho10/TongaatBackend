const {
    createAdvisoryService,getAllBusinessAdvisoryRequests,updateAdvisoryRequestStatusService,getSupplierAdvisoryRequestsService
} = require("../../UserService/BissnessAdvisory/advisoryService");
const transporter = require("../../config/email");
const db = require("../../config/database");

// Keep your existing imports for db, transporter,
// and createAdvisoryService.

// =====================================================
// CREATE BUSINESS ADVISORY REQUEST
// =====================================================

const createAdvisoryRequest = async (req, res) => {
    try {
        console.log("Advisory request received");

        // =================================================
        // GET USER ID FROM TOKEN
        // =================================================

        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        // =================================================
        // REQUEST BODY
        // =================================================

        const {
            subject,
            description,
            request_date,
            preferred_date
        } = req.body;

        // =================================================
        // VALIDATION
        // =================================================

        if (
            typeof subject !== "string" ||
            !subject.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject and description are required"
            });
        }

        const date = request_date ||
            new Date().toISOString().split("T")[0];

        const isValidDate = (value) =>
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value;

        if (
            !isValidDate(date) ||
            (preferred_date != null && !isValidDate(preferred_date))
        ) {
            return res.status(400).json({
                success: false,
                message: "Dates must be valid YYYY-MM-DD values"
            });
        }

        // =================================================
        // GET USER DETAILS
        // =================================================

        const [users] = await db.query(
            `
            SELECT
                user_id,
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
        // CREATE ADVISORY REQUEST
        // =================================================

        console.log("Creating advisory request for:", user_id);

        const result = await createAdvisoryService({
            user_id,
            subject: subject.trim(),
            description: description.trim(),
            request_date: date,
            preferred_date: preferred_date ?? null
        });

        console.log("Advisory created successfully");

        // =================================================
        // SEND CONFIRMATION EMAIL
        // =================================================

        let emailSent = false;

        try {

            await transporter.sendMail({

                from: process.env.SMTP_FROM || process.env.SMTP_USER,

                to: user.email,

                subject: "Business Advisory Request Confirmation - Tongaat Hulett",

                text: `
Dear ${user.first_name} ${user.last_name},

Thank you for submitting your Business Advisory Request through the Tongaat Hulett Enterprise and Supplier Development Portal.

We are pleased to confirm that your request has been successfully received.

REQUEST DETAILS

Subject: ${subject.trim()}

Description:
${description.trim()}

Request Date: ${date}

Preferred Date: ${preferred_date || "Not specified"}

Status: PENDING

Our Enterprise and Supplier Development Team will review your request and contact you regarding the next steps.

Please note that your preferred date is subject to confirmation by the team.

Thank you for using the Tongaat Hulett Enterprise and Supplier Development Portal.

Kind regards,
Tongaat Hulett Enterprise and Supplier Development Team
                `.trim()

            });

            emailSent = true;

            console.log(
                "Business advisory confirmation email sent:",
                user.email
            );

        } catch (emailError) {

            console.error(
                "Business advisory confirmation email failed:",
                emailError
            );

        }

        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message: emailSent
                ? "Business advisory request submitted successfully. Confirmation email sent."
                : "Business advisory request submitted successfully, but confirmation email could not be sent.",

            data: result,

            email_sent: emailSent

        });

    } catch (error) {

        console.error("Advisory request error:", error);

        // =================================================
        // FOREIGN KEY ERROR
        // =================================================

        if (error.code === "ER_NO_REFERENCED_ROW_2") {

            return res.status(400).json({
                success: false,
                message: "Authenticated user does not exist"
            });

        }

        // =================================================
        // SERVER ERROR
        // =================================================

        return res.status(500).json({
            success: false,
            message: "Failed to submit advisory request"
        });

    }
};



const getAllAdvisoryRequests = async (req, res) => {
    try {
        const requests = await getAllBusinessAdvisoryRequests();

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error(
            "Error fetching business advisory requests:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch business advisory requests"
        });
    }
};



// Add to your existing service imports:
// updateAdvisoryRequestStatusService

// ======================================================
// UPDATE BUSINESS ADVISORY REQUEST STATUS CONTROLLER
// ======================================================

const updateAdvisoryRequestStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body || {};

        // ==============================================
        // VALIDATE REQUEST ID
        // ==============================================

        if (
            !/^[1-9]\d*$/.test(String(id)) ||
            !Number.isSafeInteger(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid advisory request ID is required"
            });
        }

        // ==============================================
        // VALIDATE STATUS
        // ==============================================

        if (
            typeof status !== "string" ||
            !status.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        // ==============================================
        // UPDATE ADVISORY REQUEST
        // ==============================================

        const updatedRequest =
            await updateAdvisoryRequestStatusService(
                Number(id),
                status
            );

        return res.status(200).json({
            success: true,
            message: "Advisory request status updated successfully",
            request: updatedRequest
        });

    } catch (error) {

        console.error(
            "Update advisory request status error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to update advisory request status"
        });
    }
};


// ======================================================
// GET LOGGED-IN SUPPLIER ADVISORY REQUESTS
// ======================================================

const getSupplierAdvisoryRequests = async (req, res) => {

    try {

        // Get user ID from authenticated JWT
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in."
            });
        }

        // Fetch requests belonging to this supplier
        const requests =
            await getSupplierAdvisoryRequestsService(user_id);

        return res.status(200).json({
            success: true,
            message: "Supplier advisory requests fetched successfully",
            total_requests: requests.length,
            requests
        });

    } catch (error) {

        console.error(
            "Get supplier advisory requests error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch supplier advisory requests"
        });
    }
};



module.exports = {
    createAdvisoryRequest,getAllAdvisoryRequests,updateAdvisoryRequestStatus,getSupplierAdvisoryRequests
};