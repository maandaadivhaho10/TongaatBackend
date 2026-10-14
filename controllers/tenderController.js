const { randomUUID } = require("crypto");

const {
    containerClient
} = require("../config/azureStorage");

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

        // =====================================================
        // GET FORM DATA
        // =====================================================

      let tenderData;

try {
    tenderData = JSON.parse(req.body.data);
} catch (error) {
    return res.status(400).json({
        success: false,
        message: "Invalid tender JSON data"
    });
}

const {
    title,
    description,
    closing_date,
    location,
    published_by
} = tenderData;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!title || !description || !published_by) {

            return res.status(400).json({
                success: false,
                message:
                    "Title, description and published_by are required"
            });
        }


        // =====================================================
        // IMAGE URL
        // =====================================================

        let imageUrl = null;


        // =====================================================
        // UPLOAD IMAGE TO AZURE BLOB STORAGE
        // =====================================================

        if (req.file) {

            const imageFile = req.file;

            // Get file extension
            const fileExtension =
                imageFile.originalname
                    .split(".")
                    .pop();


            // Generate unique blob name
            const blobName =
                `tenders/${randomUUID()}.${fileExtension}`;


            // Create blob client
            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            // Upload image
            await blockBlobClient.uploadData(
                imageFile.buffer,
                {
                    blobHTTPHeaders: {
                        blobContentType:
                            imageFile.mimetype
                    }
                }
            );


            // Get Azure URL
            imageUrl = blockBlobClient.url;


            console.log(
                "Tender image uploaded:",
                imageUrl
            );
        }


        // =====================================================
        // CREATE TENDER
        // =====================================================

        const tenderId = await createTender({

            title,

            description,

            closing_date,

            location,

            published_by,

            image_url: imageUrl
        });


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Tender created successfully",

            tender: {

                tender_id: tenderId,

                title,

                description,

                closing_date:
                    closing_date || null,

                location:
                    location || null,

                published_by,

                image_url: imageUrl,

                status: "OPEN"
            }
        });


    } catch (error) {

        console.error(
            "Create tender error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to create tender",

            error: error.message
        });
    }
}


// =====================================================
// GET ALL TENDERS
// =====================================================

async function getAllTendersController(req, res) {

    try {

        const tenders =
            await getAllTenders();


        return res.status(200).json({

            success: true,

            count: tenders.length,

            tenders
        });


    } catch (error) {

        console.error(
            "Get tenders error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch tenders",

            error: error.message
        });
    }
}


// =====================================================
// GET TENDER BY ID
// =====================================================

async function getTenderByIdController(req, res) {

    try {

        const { tender_id } =
            req.params;


        if (!tender_id) {

            return res.status(400).json({
                success: false,
                message:
                    "Tender ID is required"
            });
        }


        const tender =
            await getTenderById(
                tender_id
            );


        if (!tender) {

            return res.status(404).json({

                success: false,

                message:
                    "Tender not found"
            });
        }


        return res.status(200).json({

            success: true,

            tender
        });


    } catch (error) {

        console.error(
            "Get tender error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch tender",

            error: error.message
        });
    }
}


module.exports = {

    createTenderController,

    getAllTendersController,

    getTenderByIdController
};