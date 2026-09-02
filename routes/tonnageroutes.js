const express = require("express");

const {
    createTonnage,
    getAllTonnage,
    getTonnageByUserId
} = require("../controllers/tonnagecontroller");

const router = express.Router();

router.post("/", createTonnage);

router.get("/", getAllTonnage);


router.get("/user/:user_id", getTonnageByUserId);

module.exports = router;