const express = require("express");
const router = express.Router();

const workshopController = require("../controllers/workshopController");

// Create workshop
router.post("/create", workshopController.createWorkshop);

module.exports = router;