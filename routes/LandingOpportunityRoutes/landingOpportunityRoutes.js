const express = require("express");
const router = express.Router();

const {
    getLandingOpportunities
} = require("../../controllers/LandingOpportunitiesController/landingOpportunityController");

// Public route for landing page
router.get("/latest", getLandingOpportunities);

module.exports = router;