const express = require("express");
const router = express.Router();

const {
  fetchGenderDistribution}
= require("../../controllers/GenderController/genderController");

const 
  authenticateToken
= require("../../middleware/authMiddleware");
const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

// GET gender distribution for ED Team dashboard
router.get(
  "/gender-distribution",
  authenticateToken,
  authorizeRoles(2),
  fetchGenderDistribution
);

module.exports = router;