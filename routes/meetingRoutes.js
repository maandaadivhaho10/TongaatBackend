const express = require("express");

const router = express.Router();
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");


const meetingController = require("../controllers/meetingController");

// Create meeting
router.post("/", authenticateToken,
    authorizeRoles(2), meetingController.createMeeting);

// Get all meetings
router.get("/", authenticateToken,
    authorizeRoles(2,3), meetingController.getAllMeetings);

// Get meeting by ID
router.get("/:id", meetingController.getMeetingById);

// Update meeting
router.put("/:id", meetingController.updateMeeting);

// Delete meeting
router.delete("/:id", authenticateToken,
    authorizeRoles(3) ,meetingController.deleteMeeting);

module.exports = router;