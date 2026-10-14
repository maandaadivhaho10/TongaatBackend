const express = require("express");

const router = express.Router();

const {
    createTenderController,
    getAllTendersController,
    getTenderByIdController
} = require("../controllers/tenderController");
const upload = require("../middleware/upload");


// =====================================================
// CREATE TENDER
// POST /api/tender
// =====================================================

router.post(
    "/",upload.single("opportunity_document"),
    createTenderController
);


// =====================================================
// GET ALL TENDERS
// GET /api/tender
// =====================================================

router.get(
    "/",
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