const express = require("express");

const router = express.Router();

const {
    createTenderController,
    getAllTendersController,
    getTenderByIdController
} = require("../controllers/tenderController");
const upload = require("../middleware/upload");
const 
    authenticateToken = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

// =====================================================
// CREATE TENDER
// POST /api/tender
// =====================================================

router.post(
    "/",upload.single("opportunity_document"),authenticateToken,authorizeRoles(2,3),
    createTenderController
);


// =====================================================
// GET ALL TENDERS
// GET /api/tender
// =====================================================

router.get(
    "/",authenticateToken,authorizeRoles(1,2,3),
    getAllTendersController
);


// =====================================================
// GET TENDER BY ID
// GET /api/tender/:tender_id
// =====================================================

router.get(
    "/:tender_id",
    getTenderByIdController
);


module.exports = router;