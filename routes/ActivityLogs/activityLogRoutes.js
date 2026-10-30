const express = require("express");
const router = express.Router();

const {
  fetchActivityLogs,
  fetchActivitySummary,
} = require(
  "../../controllers/ActivityLogs/activityLogController"
);


const 
    authenticateToken = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

// Only SUPER_ADMIN (role_id = 4)

router.get(
  "/",
  authenticateToken,
  authorizeRoles(4),
  fetchActivityLogs
);

router.get(
  "/summary",
  authenticateToken,
  authorizeRoles(4),
  fetchActivitySummary
);

module.exports = router;