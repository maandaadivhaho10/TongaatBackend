
const express = require("express");
const router = express.Router();

const {
  getDashboardStats
} = require("../../controllers/SuperAdmin/superAdminController");
const {
  getAllUsers,
} = require("../../controllers/SuperAdmin/superAdminUserController");
const {
  updateUserStatus,
  updateUserRole,
} = require("../../controllers/SuperAdmin/superAdminUserActionsController");
const {
  createUser,
} = require(
  "../../controllers/SuperAdmin/userManagementController"
);

// Keep your existing working middleware imports
const 
    authenticateToken
 = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

router.get(
  "/dashboard/stats",
  authenticateToken,
  authorizeRoles(4),
  getDashboardStats
);
router.get(
  "/users",
  authenticateToken,
  authorizeRoles(4),
  getAllUsers
);
router.patch(
  "/users/:userId/status",
  authenticateToken,
  authorizeRoles(4),
  updateUserStatus
);

router.patch(
  "/users/:userId/role",
  authenticateToken,
  authorizeRoles(4),
  updateUserRole
);
router.post(
  "/users",
  authenticateToken,
  authorizeRoles(4),
  createUser
);
module.exports = router;
