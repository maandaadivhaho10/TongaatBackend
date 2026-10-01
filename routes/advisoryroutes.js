const express = require("express");

const {
    createAdvisoryRequest,
    getAllAdvisoryRequests,
    getAdvisoryRequestById,
    getAdvisoryRequestsByUserId
} = require("../controllers/advisorycontroller");
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();


// Create advisory request
router.post("/",authenticateToken,authorizeRoles(2), createAdvisoryRequest);


// Get all advisory requests
router.get("/",authenticateToken,authorizeRoles(3), getAllAdvisoryRequests);


// Get advisory requests by user ID
// IMPORTANT: keep this before /:id
router.get("/user/:user_id",authenticateToken,authorizeRoles(2,3), getAdvisoryRequestsByUserId);


// Get advisory request by ID
router.get("/:id", getAdvisoryRequestById);


module.exports = router;