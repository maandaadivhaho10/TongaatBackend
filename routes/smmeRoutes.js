const express = require("express");

const router = express.Router();

const {
    registerSmme
} = require("../controllers/smmeController");


router.post(
    "/register",
    registerSmme
);


module.exports = router;