const meetingParticipantService =
    require("../UserService/meetingParticipantService");

const respondToMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { user_id, response_status } = req.body;

        if (!meetingId || !user_id || !response_status) {
            return res.status(400).json({
                success: false,
                message: "meetingId, user_id and response_status are required"
            });
        }

        // Only ACCEPTED or DECLINED
        if (!["ACCEPTED", "DECLINED"].includes(response_status)) {
            return res.status(400).json({
                success: false,
                message: "response_status must be ACCEPTED or DECLINED"
            });
        }

        const result =
            await meetingParticipantService.respondToMeeting(
                meetingId,
                user_id,
                response_status
            );

        res.status(200).json({
            success: true,
            message: `Meeting ${response_status.toLowerCase()} successfully`,
            response_status,
            action: result.action
        });

    } catch (error) {
        console.error("Meeting response error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to respond to meeting",
            error: error.message
        });
    }
};

module.exports = {
    respondToMeeting
};