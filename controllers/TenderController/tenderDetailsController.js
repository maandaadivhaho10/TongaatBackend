
const {
    getTenderWithResponses
} = require("../../UserService/Tender/tenderDetailsService");

// =====================================================
// GET TENDER DETAILS AND RESPONSES
// =====================================================

async function getTenderDetails(req, res) {

    try {

        const { tenderId } = req.params;

        // ---------------------------------------------
        // VALIDATE TENDER ID
        // ---------------------------------------------

        if (
            !/^[1-9]\d*$/.test(String(tenderId)) ||
            !Number.isSafeInteger(Number(tenderId))
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid tender ID is required"
            });
        }

        // ---------------------------------------------
        // CALL SERVICE
        // ---------------------------------------------

        const result = await getTenderWithResponses(
            Number(tenderId)
        );

        // ---------------------------------------------
        // TENDER NOT FOUND
        // ---------------------------------------------

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Tender not found"
            });
        }

        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Tender details retrieved successfully",
            data: result
        });

    } catch (error) {

        console.error(
            "Get tender details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve tender details"
        });
    }
}

module.exports = {
    getTenderDetails
};
