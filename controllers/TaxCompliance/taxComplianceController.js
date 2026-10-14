
const {
    updateTaxComplianceStatus,
    ALLOWED_STATUSES
} = require("../../UserService/TaxComplianceStatus/taxComplianceService");

// =====================================================
// UPDATE TAX COMPLIANCE STATUS CONTROLLER
// =====================================================

const updateBusinessTaxCompliance = async (req, res) => {

    try {

        const { business_id } = req.params;
        const { tax_compliance_status } = req.body || {};

        const businessId = Number(business_id);

        if (
            !Number.isSafeInteger(businessId) ||
            businessId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID is required"
            });
        }

        if (
            typeof tax_compliance_status !== "string" ||
            !ALLOWED_STATUSES.includes(tax_compliance_status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid tax compliance status",
                allowed_statuses: ALLOWED_STATUSES
            });
        }

        const result = await updateTaxComplianceStatus(
            businessId,
            tax_compliance_status
        );

        return res.status(200).json({
            success: true,
            message: "Tax compliance status updated successfully",
            data: result
        });

    } catch (error) {

        console.error(
            "Update tax compliance status error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to update tax compliance status"
        });
    }
};
// Correct
module.exports = {
    updateBusinessTaxCompliance
};