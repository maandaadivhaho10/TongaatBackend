const express = require("express");

const router = express.Router();

const {
    registerSmme
} = require("../controllers/smmeController");
const uploadDocuments =
    require("../middleware/uploadBissnessDocuments")


router.post(
    "/register",
    uploadDocuments.array("business_documents", 3),
    registerSmme
);

module.exports = router;