const advisoryService = require("../UserService/advisoryservice");

const createAdvisoryRequest = async (req, res) => {
    try {
        console.log("1. Advisory controller reached");

        const user_id = req.user?.user_id;

        const {
            subject,
            description,
            request_date,
            preferred_date
        } = req.body;

        console.log("2. User ID:", user_id);

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        console.log("3. Before calling database");

        const result = await advisoryService({
            user_id,
            subject,
            description,
            request_date,
            preferred_date
        });

        console.log("4. Database completed:", result);

        return res.status(201).json({
            success: true,
            message: "Advisory request submitted",
            data: result
        });

    } catch (error) {
        console.error("Advisory error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
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