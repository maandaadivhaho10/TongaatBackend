const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const {
    registerFarmer
} = require("../controllers/farmerController");
const uploadDocuments =
    require("../middleware/uploadBissnessDocuments")
    const {
    registerSmme
} = require("../controllers/smmeController");


const authController1 = require("../controllers/EDteamRegisterController");

// Create user
router.post(
    "/register/edteam",
    authController1.createUser
);


router.post(
    "/register/farmer",

    
    uploadDocuments.array(
        "documents",
        3
    ),

    registerFarmer
);



router.post(
    "/register/smme",
    uploadDocuments.array("business_documents", 3),
    registerSmme
);



router.post("/login", authController.login);

module.exports = router;