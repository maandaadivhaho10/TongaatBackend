const inputRequestService = require("../UserService/inputRequestService");
const db = require("../config/database");


const createInputRequest = async (req, res) => {
  let connection;
    try {
             connection = await db.getConnection();
        const {
            user_id,
            request_type,
            input_name,
            quantity,
            unit,
            reason,
            request_date
        } = req.body;


        // Validate required fields
        if (
            !user_id ||
            !request_type ||
            !input_name ||
            !request_date
        ) {
            return res.status(400).json({
                success: false,
                message: "user_id, request_type, input_name and request_date are required"
            });
        }


        // Validate request type
        if (
            request_type !== "CHEMICAL" &&
            request_type !== "FERTILIZER"
        ) {
            return res.status(400).json({
                success: false,
                message: "request_type must be CHEMICAL or FERTILIZER"
            });
        }


        const request =
            await inputRequestService.createInputRequest(
                connection,
                {
                    user_id,
                    request_type,
                    input_name,
                    quantity,
                    unit,
                    reason,
                    request_date
                }
            );


        return res.status(201).json({
            success: true,
            message: "Input request submitted successfully",
            data: request
        });

    } catch (error) {

        console.error(
            "Create input request error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create input request"
        });
    }
};


const getInputRequests = async (req, res) => {

    try {

        const requests =
            await inputRequestService.getInputRequests(db);

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {

        console.error(
            "Get input requests error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve input requests"
        });
    }
};


const getInputRequestById = async (req, res) => {

    try {

        const { id } = req.params;

        const request =
            await inputRequestService.getInputRequestById(
                db,
                id
            );


        if (!request) {

            return res.status(404).json({
                success: false,
                message: "Input request not found"
            });
        }


        return res.status(200).json({
            success: true,
            data: request
        });

    } catch (error) {

        console.error(
            "Get input request error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve input request"
        });
    }
};


const getInputRequestsByUser = async (req, res) => {

    try {

        const { userId } = req.params;

        const requests =
            await inputRequestService.getInputRequestsByUser(
                db,
                userId
            );


        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {

        console.error(
            "Get user input requests error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user input requests"
        });
    }
};


const updateInputRequestStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;


        const allowedStatuses = [
            "PENDING",
            "APPROVED",
            "REJECTED",
            "COMPLETED"
        ];


        if (!status) {

            return res.status(400).json({
                success: false,
                message: "status is required"
            });
        }


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid status. Allowed values: PENDING, APPROVED, REJECTED, COMPLETED"
            });
        }


        const request =
            await inputRequestService.updateInputRequestStatus(
                db,
                id,
                status
            );


        if (!request) {

            return res.status(404).json({
                success: false,
                message: "Input request not found"
            });
        }


        return res.status(200).json({
            success: true,
            message: "Input request status updated successfully",
            data: request
        });

    } catch (error) {

        console.error(
            "Update input request status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update input request status"
        });
    }
};


module.exports = {
    createInputRequest,
    getInputRequests,
    getInputRequestById,
    getInputRequestsByUser,
    updateInputRequestStatus
};