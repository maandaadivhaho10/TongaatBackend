const express = require("express");
const router = express.Router();

const {
    createAdvisoryRequest,getAllAdvisoryRequests
} = require("../../controllers/BissnessAdvisory/advisoryController");


const 
    authenticateToken = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

router.post(
    "/",
    authenticateToken,authorizeRoles(1,2, 3, 4),
    createAdvisoryRequest
);
router.get(
    "/requests",
    authenticateToken,
    authorizeRoles(2, 3, 4),
    getAllAdvisoryRequests
);

module.exports = router;