
const express = require("express");
const router = express.Router();

const cipcController = require("../../controllers/VerifyCompany/cipcController");

// Verify a company's CIPC registration
router.post(
    "/verify",
    cipcController.verifyCompany
);

module.exports = router;
