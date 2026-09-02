const advisoryService = require("../UserService/advisoryservice");

// Create advisory request
const createAdvisoryRequest = async (req, res) => {
    try {
        const {
            user_id,
            subject,
            description,
            request_date,
            preferred_date
        } = req.body;

        if (
            !user_id ||
            !subject ||
            !description ||
            !request_date
        ) {
            return res.status(400).json({
                success: false,
                message: "user_id, subject, description and request_date are required"
            });
        }

        const requestId =
            await advisoryService.createAdvisoryRequest(req.body);

        res.status(201).json({
            success: true,
            message: "Business advisory request submitted successfully",
            advisory_request_id: requestId
        });

    } catch (error) {
        console.error("Create advisory request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create advisory request"
        });
    }
};


// Get all advisory requests
const getAllAdvisoryRequests = async (req, res) => {
    try {
        const requests =
            await advisoryService.getAllAdvisoryRequests();

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error("Get advisory requests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get advisory requests"
        });
    }
};


// Get advisory request by ID
const getAdvisoryRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request =
            await advisoryService.getAdvisoryRequestById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Advisory request not found"
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });

    } catch (error) {
        console.error("Get advisory request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get advisory request"
        });
    }
};


// Get advisory requests by user ID
const getAdvisoryRequestsByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;

        const requests =
            await advisoryService.getAdvisoryRequestsByUserId(user_id);

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error("Get user advisory requests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get user's advisory requests"
        });
    }
};


module.exports = {
    createAdvisoryRequest,
    getAllAdvisoryRequests,
    getAdvisoryRequestById,
    getAdvisoryRequestsByUserId
};