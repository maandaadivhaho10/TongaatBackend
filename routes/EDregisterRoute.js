
const express = require("express");

const router = express.Router();

const authController = require("../controllers/EDteamRegisterController");

// Create user
router.post(
    "/register3",
    authController.createUser
);

module.exports = router;

