const meetingService = require("../UserService/meetingService");

// Create meeting
const createMeeting = async (req, res) => {
    try {
        const {
            title,
            description,
            meeting_date,
            meeting_time,
            location,
            target_role_id,
            created_by
        } = req.body;

        if (
            !title ||
            !meeting_date ||
            !meeting_time ||
            !target_role_id ||
            !created_by
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const meeting = await meetingService.createMeeting(req.body);

        res.status(201).json({
            success: true,
            message: "Meeting created successfully",
            data: meeting
        });

    } catch (error) {
        console.error("Create meeting error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create meeting",
            error: error.message
        });
    }
};

// Get all meetings
const getAllMeetings = async (req, res) => {
    try {
        const meetings = await meetingService.getAllMeetings();

        res.status(200).json({
            success: true,
            data: meetings
        });

    } catch (error) {
        console.error("Get meetings error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve meetings",
            error: error.message
        });
    }
};

// Get meeting by ID
const getMeetingById = async (req, res) => {
    try {
        const { id } = req.params;

        const meeting = await meetingService.getMeetingById(id);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        res.status(200).json({
            success: true,
            data: meeting
        });

    } catch (error) {
        console.error("Get meeting error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve meeting",
            error: error.message
        });
    }
};

// Update meeting
const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;

        const existingMeeting =
            await meetingService.getMeetingById(id);

        if (!existingMeeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        await meetingService.updateMeeting(id, req.body);

        res.status(200).json({
            success: true,
            message: "Meeting updated successfully"
        });

    } catch (error) {
        console.error("Update meeting error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update meeting",
            error: error.message
        });
    }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;

        const existingMeeting =
            await meetingService.getMeetingById(id);

        if (!existingMeeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        await meetingService.deleteMeeting(id);

        res.status(200).json({
            success: true,
            message: "Meeting deleted successfully"
        });

    } catch (error) {
        console.error("Delete meeting error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete meeting",
            error: error.message
        });
    }
};

module.exports = {
    createMeeting,
    getAllMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting
};