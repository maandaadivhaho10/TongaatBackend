const express = require("express");

const router = express.Router();

const {
    getAllSuppliersController,
    getSupplierByIdController
} = require("../controllers/supplierController");


// =====================================================
// GET ALL SUPPLIERS
// =====================================================

router.get(
    "/",
    getAllSuppliersController
);


// =====================================================
// GET ONE SUPPLIER
// =====================================================

router.get(
    "/:userId",
    getSupplierByIdController
);


module.exports = router;