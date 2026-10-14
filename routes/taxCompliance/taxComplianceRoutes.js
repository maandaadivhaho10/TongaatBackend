
const express = require("express");
const router = express.Router();

const {
    updateBusinessTaxCompliance
} = require(
    "../../controllers/TaxCompliance/taxComplianceController"
);

// Keep your existing working middleware imports
const {
    authenticateToken
} = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

console.log(
    "Controller:",
    typeof updateBusinessTaxCompliance
);

router.patch(
    "/:business_id/status",
    authenticateToken,
    authorizeRoles(2, 3, 4),
    updateBusinessTaxCompliance
);

module.exports = router;
