const workshopParticipantService =require("../UserService/workshopParticipantService");

const respondToWorkshop = async (req, res) => {
    try {

        const { workshopId } = req.params;
        const { user_id, response_status } = req.body;

        // Validate user
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "user_id is required"
            });
        }

        // Validate response
        if (!response_status) {
            return res.status(400).json({
                success: false,
                message: "response_status is required"
            });
        }

        // Only allow ACCEPTED or DECLINED
        const allowedResponses = ["ACCEPTED", "DECLINED"];

        if (!allowedResponses.includes(response_status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: "response_status must be ACCEPTED or DECLINED"
            });
        }

        const participant =
            await workshopParticipantService.respondToWorkshop(
                workshopId,
                user_id,
                response_status.toUpperCase()
            );

        return res.status(200).json({
            success: true,
            message: `Workshop ${response_status.toLowerCase()} successfully`,
            data: participant
        });

    } catch (error) {

        console.error("Workshop response error:", error);

        if (error.message === "Workshop not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to respond to workshop",
            error: error.message
        });
    }
};

module.exports = {
    respondToWorkshop
};