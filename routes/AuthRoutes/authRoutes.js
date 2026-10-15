
const express = require("express");
const router = express.Router();

const {
  login,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
} = require("../../controllers/AuthController/authController");

const authenticateToken = require("../../middleware/authMiddleware");


router.post("/login", login);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logoutUser);

router.get("/me", authenticateToken, getCurrentUser);




module.exports = router;




