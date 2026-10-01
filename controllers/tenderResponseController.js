const {
    createTenderResponse,
    getResponsesByTender,
    getTenderResponseById
} = require("../UserService/tenderResponseService");


// =====================================================
// CREATE TENDER RESPONSE
// =====================================================

async function createTenderResponseController(req, res) {

    try {

        const {
            tender_id,
            user_id
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!tender_id || !user_id) {

            return res.status(400).json({

                success: false,

                message:
                    "tender_id and user_id are required"

            });
        }


        // =================================================
        // CREATE RESPONSE
        // =================================================

        const responseId =
            await createTenderResponse({

                tender_id,
                user_id

            });


        return res.status(201).json({

            success: true,

            message:
                "Tender application submitted successfully",

            response: {

                tender_response_id: responseId,

                tender_id,

                user_id,

                status: "SUBMITTED",

                email_sent: false

            }

        });


    } catch (error) {

        console.error(
            "Create tender response error:",
            error
        );


        // =================================================
        // DUPLICATE APPLICATION
        // =================================================

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                success: false,

                message:
                    "You have already applied for this tender"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to submit tender application",

            error: error.message

        });
    }
}


// =====================================================
// GET RESPONSES FOR TENDER
// =====================================================

async function getResponsesByTenderController(req, res) {

    try {

        const {
            tender_id
        } = req.params;


        const responses =
            await getResponsesByTender(
                tender_id
            );


        return res.status(200).json({

            success: true,

            count: responses.length,

            responses

        });


    } catch (error) {

        console.error(
            "Get tender responses error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch tender responses",

            error: error.message

        });
    }
}


// =====================================================
// GET RESPONSE BY ID
// =====================================================

async function getTenderResponseByIdController(
    req,
    res
) {

    try {

        const {
            tender_response_id
        } = req.params;


        const response =
            await getTenderResponseById(
                tender_response_id
            );


        if (!response) {

            return res.status(404).json({

                success: false,

                message:
                    "Tender response not found"

            });
        }


        return res.status(200).json({

            success: true,

            response

        });


    } catch (error) {

        console.error(
            "Get tender response error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch tender response",

            error: error.message

        });
    }
}


module.exports = {

    createTenderResponseController,

    getResponsesByTenderController,

    getTenderResponseByIdController

};