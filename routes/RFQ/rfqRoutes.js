const express = require("express");

const router = express.Router();

const {
    createRFQOpportunity,getUserRFQs,getMyAppliedRFQs,getAllRFQs
} = require("../../controllers/RFQ/rfqController");

const {
    applyForRFQ
} = require("../../controllers/RFQ/rfqResponseController");
const 
    authenticateToken
 = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

const upload = require("../../middleware/upload");


// Create RFQ opportunity
router.post(
    "/",upload.single("opportunity_document"),
    createRFQOpportunity
);
// Get RFQs for user's sector
router.get(
    "/user",authenticateToken,
    getUserRFQs
);


// =====================================================
// APPLY FOR RFQ
// =====================================================

router.post(
    "/:rfqId/apply",upload.single("quotation_document"),
    applyForRFQ
);

router.get(
    "/my-applications/:userId",
   getMyAppliedRFQs
);


router.get(
    "/",
    authenticateToken,
    authorizeRoles(2, 3, 4),
    getAllRFQs
);


module.exports = router;