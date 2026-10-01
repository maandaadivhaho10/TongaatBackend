// routes/otpRoutes.js

const express = require("express");

const router = express.Router();

const {
    verifyUserOtp
} = require("../controllers/otpController");

router.post(
    "/verify",
    verifyUserOtp
);

module.exports = router;