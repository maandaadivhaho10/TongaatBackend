
const {
    getTenderWithResponses,getAppliedTendersByUserId
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
// controllers/tenderApplicationController.js



/**
 * GET /api/tender-responses/my-applications/:userId
 */
async function getMyAppliedTenders(req, res) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "A valid user ID is required." });
    }

    const requesterId = Number(req.user?.user_id);
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && requesterId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view these applications.",
      });
    }

    const applications = await getAppliedTendersByUserId(userId);

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("getMyAppliedTenders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your tender applications.",
    });
  }
}


module.exports = {
    getTenderDetails,getMyAppliedTenders
};
