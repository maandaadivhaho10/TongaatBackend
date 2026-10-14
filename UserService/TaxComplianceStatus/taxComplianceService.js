
const db = require("../../config/database");

const ALLOWED_STATUSES = [
    "NOT_VERIFIED",
    "COMPLIANT",
    "NON_COMPLIANT"
];

// =====================================================
// UPDATE TAX COMPLIANCE STATUS
// =====================================================

const updateTaxComplianceStatus = async (
    businessId,
    taxComplianceStatus
) => {

    const connection = await db.getConnection();

    try {

        // Check whether the business exists
        const [businesses] = await connection.execute(
            `
            SELECT
                business_id,
                business_name,
                tax_compliance_status
            FROM business_profile
            WHERE business_id = ?
            `,
            [businessId]
        );

        if (businesses.length === 0) {
            const error = new Error(
                "Business profile not found"
            );
            error.statusCode = 404;
            throw error;
        }

        // Update tax compliance status
        await connection.execute(
            `
            UPDATE business_profile
            SET
                tax_compliance_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE business_id = ?
            `,
            [
                taxComplianceStatus,
                businessId
            ]
        );

        return {
            business_id: businesses[0].business_id,
            business_name: businesses[0].business_name,
            previous_status:
                businesses[0].tax_compliance_status,
            tax_compliance_status: taxComplianceStatus
        };

    } finally {
        connection.release();
    }
};

module.exports = {
    updateTaxComplianceStatus,
    ALLOWED_STATUSES
};
