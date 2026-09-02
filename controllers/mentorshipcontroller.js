const mentorshipService = require("../UserService/mentorshipservice");

// Insert mentorship request
const createMentorshipRequest = async (req, res) => {
    try {
        const {
            user_id,
            business_goal,
            description,
            preferred_area,
            request_date
        } = req.body;

        if (
            !user_id ||
            !business_goal ||
            !description ||
            !request_date
        ) {
            return res.status(400).json({
                success: false,
                message: "user_id, business_goal, description and request_date are required"
            });
        }

        const requestId =
            await mentorshipService.createMentorshipRequest(req.body);

        res.status(201).json({
            success: true,
            message: "Mentorship request submitted successfully",
            mentorship_request_id: requestId
        });

    } catch (error) {
        console.error("Create mentorship request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create mentorship request"
        });
    }
};


// Get all mentorship requests
const getAllMentorshipRequests = async (req, res) => {
    try {
        const requests =
            await mentorshipService.getAllMentorshipRequests();

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error("Get mentorship requests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get mentorship requests"
        });
    }
};


// Get mentorship request by ID
const getMentorshipRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request =
            await mentorshipService.getMentorshipRequestById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Mentorship request not found"
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });

    } catch (error) {
        console.error("Get mentorship request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get mentorship request"
        });
    }
};


module.exports = {
    createMentorshipRequest,
    getAllMentorshipRequests,
    getMentorshipRequestById
};