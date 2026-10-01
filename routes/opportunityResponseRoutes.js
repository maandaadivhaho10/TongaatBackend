const express = require("express");

const router = express.Router();

const {
    getResponsesByOpportunityName
} = require("../controllers/opportunityResponseController");

router.get(
    "/opportunity/:name/responses",
    getResponsesByOpportunityName
);

module.exports = router;