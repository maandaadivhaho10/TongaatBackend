
const express = require("express");

const router = express.Router();

const {
    getTenderDetails,getMyAppliedTenders
} = require("../../controllers/TenderController/tenderDetailsController");

// Keep your existing working middleware imports
const 
    authenticateToken
 = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

// ED_TEAM = 2
// ADMIN = 3
// SUPER_ADMIN = 4

router.get(
    "/:tenderId/details",
    authenticateToken,
    authorizeRoles(2, 3, 4),
    getTenderDetails
);


 
router.get("/my-applications/:userId",  authenticateToken,authorizeRoles(1,2,3),getMyAppliedTenders)

module.exports = router;
