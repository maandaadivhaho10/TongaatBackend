const express = require("express");

const {
    createAdvisoryRequest,
    getAllAdvisoryRequests,
    getAdvisoryRequestById,
    getAdvisoryRequestsByUserId
} = require("../controllers/advisorycontroller");

const router = express.Router();


// Create advisory request
router.post("/", createAdvisoryRequest);


// Get all advisory requests
router.get("/", getAllAdvisoryRequests);


// Get advisory requests by user ID
// IMPORTANT: keep this before /:id
router.get("/user/:user_id", getAdvisoryRequestsByUserId);


// Get advisory request by ID
router.get("/:id", getAdvisoryRequestById);


module.exports = router;