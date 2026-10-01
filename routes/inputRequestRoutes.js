const express = require("express");

const router = express.Router();

const inputRequestController =
    require("../controllers/inputRequestController");
    const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");


// Create chemical/fertilizer request
router.post(
    "/", authenticateToken,
    authorizeRoles(1),
    inputRequestController.createInputRequest
);
// Get requests belonging to one user
router.get(
    "/user", authenticateToken,
    authorizeRoles(1),
    inputRequestController.getInputRequestsByUser
);
// Get  all requests
router.get(
    "/all",
    inputRequestController.getInputRequests
);




// Update request status
router.patch(
    "/:id/status",
    inputRequestController.updateInputRequestStatus
);


module.exports = router;