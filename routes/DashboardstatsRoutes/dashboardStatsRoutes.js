const express = require("express");
const router = express.Router();

const {
  fetchDashboardStatistics
} = require(
  "../../controllers/DashboardStats/dashboardStatsController"
);

const 
  authenticateToken
= require("../../middleware/authMiddleware");
const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

// ED Team Dashboard Statistics
// Role ID 2 = ED Team

router.get(
  "/statistics",
  fetchDashboardStatistics
);

module.exports = router;