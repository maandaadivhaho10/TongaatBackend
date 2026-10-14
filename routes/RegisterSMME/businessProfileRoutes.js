const express = require("express");
const multer = require("multer");

const {
    registerBusinessProfile
} = require("../../controllers/SMMERegister/businessProfileController");

const {
    authenticateToken
} = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "application/pdf"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files allowed"));
        }
    }
});

// =====================================================
// REGISTER BUSINESS PROFILE
// =====================================================

router.post(
    "/register",

    authenticateToken,

    authorizeRoles(1),

    upload.fields([
        {
            name: "bee_document",
            maxCount: 1
        },
        {
            name: "company_registration_document",
            maxCount: 1
        }
    ]),

    registerBusinessProfile
);

module.exports = router;