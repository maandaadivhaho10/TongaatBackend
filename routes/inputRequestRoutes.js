const express = require("express");

const router = express.Router();

const inputRequestController =
    require("../controllers/inputRequestController");


// Create chemical/fertilizer request
router.post(
    "/",
    inputRequestController.createInputRequest
);


// Get all requests
router.get(
    "/",
    inputRequestController.getInputRequests
);


// Get requests belonging to one user
router.get(
    "/user/:userId",
    inputRequestController.getInputRequestsByUser
);


// Get one request
router.get(
    "/:id",
    inputRequestController.getInputRequestById
);


// Update request status
router.patch(
    "/:id/status",
    inputRequestController.updateInputRequestStatus
);


module.exports = router;