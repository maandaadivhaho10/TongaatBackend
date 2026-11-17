const express = require("express");

const router = express.Router();

const {
    forgotPassword,
    changePassword
} = require("../../controllers/PasswordReset/passwordResetController");


// Request password reset OTP
router.post("/forgot-password", forgotPassword);

// Verify OTP and update password
router.post("/reset-password", changePassword);


module.exports = router;