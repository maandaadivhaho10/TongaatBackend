
const express = require("express");

const router = express.Router();

const {
    registerBusinessMaturity
} = require("../../controllers/SMMERegister/businessMaturityController");

const 
    authenticateToken
 = require("../../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../../middleware/roleMiddleware");
const multer = require("multer");


const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype !== "application/pdf") {
            return cb(
                new Error(
                    "Only PDF files are allowed for financial statements"
                )
            );
        }

        cb(null, true);
    }
});





router.post(
    "/register",
     authenticateToken,authorizeRoles(1),upload.fields([
        {
            name: "financial_statement",
            maxCount: 1
        }
    ]),
    registerBusinessMaturity
);

module.exports = router;
