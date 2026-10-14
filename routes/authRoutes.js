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
} = require("../controllers/SMMERegister/smmeController");
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");


const authController1 = require("../controllers/SMMERegister/RegisterProfileController");

// Create user
router.post(
    "/register/smme",
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
    "/register/company",authenticateToken,authorizeRoles(1),
    uploadDocuments.array("business_documents", 3),
    registerSmme
);



router.post("/login", authController.login);

module.exports = router;