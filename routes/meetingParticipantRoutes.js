const express = require("express");

const router = express.Router();

const meetingParticipantController =
    require("../controllers/meetingParticipantController");

router.put(
    "/:meetingId/respond",
    meetingParticipantController.respondToMeeting
);

module.exports = router;