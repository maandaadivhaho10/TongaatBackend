const express = require("express");
const router = express.Router();
const 
    authenticateToken
= require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

const {
  checkRegistrationStatus
} = require("../../controllers/SMMERegister/registrationStatusController");

router.get(
  "/status",
  authenticateToken,
  checkRegistrationStatus
);

module.exports = router;