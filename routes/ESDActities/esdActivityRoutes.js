
const express = require("express");
const router = express.Router();

const {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} = require("../../controllers/ESDactivityController/esdActivityController");

// Adjust the middleware paths to match
// your existing project structure.
const 
    authenticateToken
 = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");


// ED Team creates an activity
router.post(
  "/",authenticateToken,
  authorizeRoles(2),
  createActivity
);

// All authenticated users can view activities
router.get("/",authenticateToken,
  authorizeRoles(2,1,4), getAllActivities);

// Get specific activity
router.get("/:id", getActivityById);

// ED Team updates an activity
router.put(
  "/:id",
  authorizeRoles(2),
  updateActivity
);

// ED Team deletes an activity
router.delete(
  "/:id",
  authorizeRoles(2),
  deleteActivity
);

module.exports = router;
