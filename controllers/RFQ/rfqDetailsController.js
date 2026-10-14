
const {
    getRFQWithResponses
} = require("../../UserService/RFQ/rfqDetailsService");

// =====================================================
// GET RFQ DETAILS AND ALL SUPPLIER RESPONSES
// =====================================================

async function getRFQDetails(req, res) {

    try {

        const { rfqId } = req.params;

        // ---------------------------------------------
        // VALIDATE RFQ ID
        // ---------------------------------------------

        if (
            !/^[1-9]\d*$/.test(String(rfqId)) ||
            !Number.isSafeInteger(Number(rfqId))
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid RFQ ID is required"
            });
        }

        // ---------------------------------------------
        // CALL SERVICE
        // ---------------------------------------------

        const result = await getRFQWithResponses(
            Number(rfqId)
        );

        // ---------------------------------------------
        // RFQ NOT FOUND
        // ---------------------------------------------

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "RFQ not found"
            });
        }

        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "RFQ details retrieved successfully",
            data: result
        });

    } catch (error) {

        console.error(
            "Get RFQ details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve RFQ details"
        });
    }
}

module.exports = {
    getRFQDetails
};
