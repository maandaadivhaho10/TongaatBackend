const express = require("express");

const router = express.Router();

const {
    registerFarmer
} = require("../controllers/farmerController");
const uploadDocuments =
    require("../middleware/uploadBissnessDocuments")

router.post(
    "/register",

    uploadDocuments.array(
        "documents",
        3
    ),

    registerFarmer
);


module.exports = router;