const express = require("express");

const router = express.Router();

const {
    createRFQOpportunity,getUserRFQs,getMyAppliedRFQs
} = require("../controllers/rfqController");

const {
    applyForRFQ
} = require("../controllers/rfqResponseController");
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const upload = require("../middleware/upload");


// Create RFQ opportunity
router.post(
    "/",upload.single("image"),
    createRFQOpportunity
);
// Get RFQs for user's sector
router.get(
    "/user/:userId",
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



module.exports = router;