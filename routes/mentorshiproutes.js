const express = require("express");

const {
    createMentorshipRequest,
    getAllMentorshipRequests,
    getMentorshipRequestById
} = require("../controllers/mentorshipcontroller");

const router = express.Router();


// Insert mentorship request
router.post("/", createMentorshipRequest);


// Get all mentorship requests
router.get("/", getAllMentorshipRequests);


// Get mentorship request by ID
router.get("/:id", getMentorshipRequestById);


module.exports = router;