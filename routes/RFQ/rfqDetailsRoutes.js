
const express = require("express");

const router = express.Router();

const {
    getRFQDetails
} = require("../../controllers/RFQ/rfqDetailsController");
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
    "/:rfqId/details",
    authenticateToken,
    authorizeRoles(2, 3, 4),
    getRFQDetails
);

module.exports = router;
