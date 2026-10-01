const express = require("express");

const router = express.Router();

const meetingParticipantController =
    require("../controllers/meetingParticipantController");
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

    

router.put(
    "/:meetingId/respond", authenticateToken,
    authorizeRoles(2,3),
    meetingParticipantController.respondToMeeting
);

module.exports = router;