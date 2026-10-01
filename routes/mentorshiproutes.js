const express = require("express");

const {
    createMentorshipRequest,
    getAllMentorshipRequests,
    getMentorshipRequestById
} = require("../controllers/mentorshipcontroller");
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();


// Insert mentorship request
router.post("/",authenticateToken,authorizeRoles(2), createMentorshipRequest);


// Get all mentorship requests
router.get("/",authenticateToken,authorizeRoles(3), getAllMentorshipRequests);


// Get mentorship request by ID
router.get("/:id", getMentorshipRequestById);


module.exports = router;