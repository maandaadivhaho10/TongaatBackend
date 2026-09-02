const express = require("express");

const router = express.Router();

const {
    registerFarmer
} = require("../controllers/farmerController");


router.post(
    "/register",
    registerFarmer
);


module.exports = router;