
const express = require("express");

const router = express.Router();

const {
    submitContactForm
} = require("../../controllers/ContactUs/contactController");

// Public contact form endpoint
router.post("/", submitContactForm);

module.exports = router;
