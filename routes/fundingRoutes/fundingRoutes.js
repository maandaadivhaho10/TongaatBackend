
const express = require("express");
const router = express.Router();

const {
    createFunding,
    getAllFunding,
    getFundingById,
    updateFundingStatus,
    applyForFunding,
    getFundingResponses,
    getMyFundingApplications,
    updateFundingResponseStatus
} = require("../../controllers/Funding/fundingController");
// Adjust this path to your existing middleware
const 
    authenticateToken
 = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

// =====================================================
// ED TEAM - CREATE FUNDING
// =====================================================
console.log("authenticateToken:", typeof authenticateToken);
console.log("authorizeRoles:", typeof authorizeRoles);
console.log("createFunding:", typeof createFunding);

router.post(
    "/",authenticateToken,
    authorizeRoles(2),
    createFunding
);

// =====================================================
// ALL AUTHENTICATED USERS - VIEW FUNDING
// =====================================================

router.get("/",authenticateToken,
    authorizeRoles(1,2,3), getAllFunding);

// =====================================================
// SMME - MY FUNDING APPLICATIONS
// =====================================================

router.get(
    "/my-applications",
   authenticateToken,
    authorizeRoles(1),
    getMyFundingApplications
);

// =====================================================
// ED TEAM - UPDATE RESPONSE STATUS
// =====================================================

router.patch(
    "/responses/:responseId/status",
    authorizeRoles(2),
    updateFundingResponseStatus
);

// =====================================================
// ED TEAM - VIEW RESPONSES
// =====================================================

router.get(
    "/:id/responses",
   authenticateToken,
    authorizeRoles(2),
    getFundingResponses
);

// =====================================================
// ED TEAM - UPDATE FUNDING STATUS
// =====================================================

router.patch(
    "/:id/status",
    authorizeRoles(2),
    updateFundingStatus
);

// =====================================================
// SMME - APPLY FOR FUNDING
// =====================================================

router.post(
    "/:id/apply",authenticateToken,
    authorizeRoles(1),
    applyForFunding
);

// =====================================================
// GET FUNDING DETAILS
// =====================================================

router.get("/:id", getFundingById);


module.exports = router;
