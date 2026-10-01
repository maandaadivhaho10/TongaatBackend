const {
    createTender,
    getAllTenders,
    getTenderById
} = require("../UserService/tenderService");


// =====================================================
// CREATE TENDER
// =====================================================

async function createTenderController(req, res) {

    try {

        const {
            title,
            description,
            closing_date,
            location,
            published_by,
            image_url
        } = req.body;


        // Validation
        if (!title || !description || !published_by) {

            return res.status(400).json({
                success: false,
                message: "Title, description and published_by are required"
            });
        }


        const tenderId = await createTender({
            title,
            description,
            closing_date,
            location,
            published_by,
            image_url
        });


        return res.status(201).json({

            success: true,

            message: "Tender created successfully",

            tender: {
                tender_id: tenderId,
                title,
                description,
                closing_date,
                location,
                published_by,
                image_url,
                status: "OPEN"
            }
        });


    } catch (error) {

        console.error("Create tender error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create tender",
            error: error.message
        });
    }
}


// =====================================================
// GET ALL TENDERS
// =====================================================

async function getAllTendersController(req, res) {

    try {

        const tenders = await getAllTenders();

        return res.status(200).json({

            success: true,

            count: tenders.length,

            tenders
        });

    } catch (error) {

        console.error("Get tenders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tenders",
            error: error.message
        });
    }
}


// =====================================================
// GET TENDER BY ID
// =====================================================

async function getTenderByIdController(req, res) {

    try {

        const { tender_id } = req.params;

        const tender = await getTenderById(tender_id);


        if (!tender) {

            return res.status(404).json({
                success: false,
                message: "Tender not found"
            });
        }


        return res.status(200).json({

            success: true,

            tender
        });

    } catch (error) {

        console.error("Get tender error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tender",
            error: error.message
        });
    }
}


module.exports = {
    createTenderController,
    getAllTendersController,
    getTenderByIdController
};