const express = require("express");

const router = express.Router();

const {
    createTenderResponseController,
    getResponsesByTenderController,
    getTenderResponseByIdController
} = require("../controllers/tenderResponseController");


// =====================================================
// CREATE TENDER RESPONSE
// POST /api/tender-responses
// =====================================================

router.post(
    "/",
    createTenderResponseController
);


// =====================================================
// GET RESPONSES FOR TENDER
// GET /api/tender-responses/tender/:tender_id
// =====================================================

router.get(
    "/tender/:tender_id",
    getResponsesByTenderController
);


// =====================================================
// GET RESPONSE BY ID
// GET /api/tender-responses/:tender_response_id
// =====================================================

router.get(
    "/:tender_response_id",
    getTenderResponseByIdController
);


module.exports = router;