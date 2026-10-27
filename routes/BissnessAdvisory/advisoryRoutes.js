const express = require("express");
const router = express.Router();

const {
    createAdvisoryRequest,getAllAdvisoryRequests,updateAdvisoryRequestStatus,getSupplierAdvisoryRequests
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


router.patch(
    "/requests/:id/status",authenticateToken,
    authorizeRoles(2, 3, 4),
    updateAdvisoryRequestStatus
);


// ======================================================
// GET LOGGED-IN SUPPLIER BUSINESS ADVISORY REQUESTS
// ======================================================

router.get(
    "/my-requests",
    authenticateToken,
    authorizeRoles(1),
    getSupplierAdvisoryRequests
);

module.exports = router;