const {
    getAllSuppliers,
    getSupplierById
} = require("../UserService/supplierService");


// =====================================================
// GET ALL SUPPLIERS
// =====================================================

async function getAllSuppliersController(req, res) {

    try {

        const suppliers =
            await getAllSuppliers();


        return res.status(200).json({

            success: true,

            count: suppliers.length,

            suppliers
        });


    } catch (error) {

        console.error(
            "Get suppliers error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch suppliers",

            error: error.message
        });
    }
}


// =====================================================
// GET SUPPLIER BY USER ID
// =====================================================

async function getSupplierByIdController(req, res) {

    try {

        const { userId } = req.params;


        if (!userId) {

            return res.status(400).json({

                success: false,

                message:
                    "User ID is required"
            });
        }


        const supplier =
            await getSupplierById(userId);


        if (!supplier) {

            return res.status(404).json({

                success: false,

                message:
                    "Supplier not found"
            });
        }


        return res.status(200).json({

            success: true,

            supplier
        });


    } catch (error) {

        console.error(
            "Get supplier error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch supplier",

            error: error.message
        });
    }
}


module.exports = {
    getAllSuppliersController,
    getSupplierByIdController
};