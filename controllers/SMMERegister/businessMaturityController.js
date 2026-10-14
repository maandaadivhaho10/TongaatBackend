
const {
    createBusinessMaturity
} = require("../../UserService/RegisterSMME/businessMaturityService");

// =====================================================
// BOOLEAN CONVERTER
// =====================================================

const parseBoolean = (value, fieldName) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    ) {
        return 1;
    }

    if (
        value === false ||
        value === 0 ||
        value === "0" ||
        value === "false"
    ) {
        return 0;
    }

    const error = new Error(
        `Invalid boolean value for ${fieldName}`
    );

    error.statusCode = 400;

    throw error;
};

// =====================================================
// REGISTER BUSINESS MATURITY
// =====================================================

const registerBusinessMaturity = async (req, res) => {

    try {

        // =====================================================
        // 1. GET USER ID FROM JWT TOKEN
        // =====================================================

        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user"
            });
        }

        // =====================================================
        // 2. PARSE REQUEST BODY
        // =====================================================

        let data;

        try {

            data =
                typeof req.body.business_maturity === "string"
                    ? JSON.parse(req.body.business_maturity)
                    : req.body.business_maturity ?? req.body;

        } catch (error) {

            return res.status(400).json({
                success: false,
                message: "Invalid business_maturity JSON format"
            });
        }

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return res.status(400).json({
                success: false,
                message: "Business maturity data is required"
            });
        }

        // =====================================================
        // 3. VALIDATE SECTOR ID
        // =====================================================

        if (
            data.sector_id === undefined ||
            data.sector_id === null ||
            data.sector_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "sector_id is required"
            });
        }

        data.sector_id = Number(data.sector_id);

        if (
            !Number.isInteger(data.sector_id) ||
            data.sector_id <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid sector_id"
            });
        }

        // =====================================================
        // 4. CONVERT BOOLEAN FIELDS
        // =====================================================

        const booleanFields = [
            "employees_have_contracts",
            "contracts_signed",
            "registered_with_uif",
            "registered_with_coida",
            "has_business_systems",
            "has_accounting_system",
            "can_produce_financial_statements",
            "has_organisation_structure",
            "roles_clearly_defined",
            "has_payroll"
        ];

        for (const field of booleanFields) {
            data[field] = parseBoolean(
                data[field],
                field
            );
        }

        // =====================================================
        // 5. VALIDATE COIDA CERTIFICATE
        // =====================================================

        if (
            data.registered_with_coida === 1 &&
            !String(data.coida_certificate_number ?? "").trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "COIDA certificate number is required"
            });
        }

        // =====================================================
        // 6. VALIDATE ACCOUNTING SYSTEM
        // =====================================================

        if (
            data.has_accounting_system === 1 &&
            !String(data.accounting_system_name ?? "").trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Accounting system name is required"
            });
        }

        // =====================================================
        // 7. VALIDATE CLIENT REFERENCES
        // =====================================================

        const clientReferences =
            data.client_references ?? [];

        if (!Array.isArray(clientReferences)) {
            return res.status(400).json({
                success: false,
                message: "client_references must be an array"
            });
        }

        for (const client of clientReferences) {

            if (
                !client ||
                typeof client.client_name !== "string" ||
                !client.client_name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Each client reference requires a client_name"
                });
            }
        }

       
// =====================================================
// 8. VALIDATE FINANCIAL STATEMENT FILE
// =====================================================

const financialStatement =
    req.files?.financial_statement?.[0];

if (financialStatement) {

    if (
        financialStatement.mimetype !== "application/pdf"
    ) {
        return res.status(400).json({
            success: false,
            message: "Financial statement must be a PDF file"
        });
    }
}

// Optional: Require a PDF if financial statements are available
if (
    data.can_produce_financial_statements === 1 &&
    !financialStatement
) {
    return res.status(400).json({
        success: false,
        message: "Please upload your financial statement PDF"
    });
}


        // =====================================================
        // 9. VALIDATE EMPLOYEE COUNTS
        // =====================================================

        const integerFields = [
            "number_of_employees",
            "permanent_employees",
            "contract_employees",
            "financial_statements_years"
        ];

        for (const field of integerFields) {

            if (
                data[field] === undefined ||
                data[field] === null ||
                data[field] === ""
            ) {
                data[field] = 0;
                continue;
            }

            const value = Number(data[field]);

            if (!Number.isInteger(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-negative integer`
                });
            }

            data[field] = value;
        }

        if (
            data.permanent_employees +
            data.contract_employees >
            data.number_of_employees
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Permanent and contract employees cannot exceed total employees"
            });
        }

        // =====================================================
        // 10. VALIDATE FINANCIAL AMOUNTS
        // =====================================================

        const financialFields = [
            "annual_revenue",
            "largest_contract_value"
        ];

        for (const field of financialFields) {

            if (
                data[field] === undefined ||
                data[field] === null ||
                data[field] === ""
            ) {
                data[field] = null;
                continue;
            }

            const value = Number(data[field]);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-negative amount`
                });
            }

            data[field] = value;
        }

        // =====================================================
        // 11. SAVE BUSINESS MATURITY
        // =====================================================

        const result = await createBusinessMaturity(
    userId,
    data,
    clientReferences,
    req.files
);

        // =====================================================
        // 12. SUCCESS RESPONSE
        // =====================================================

        return res.status(201).json({
            success: true,
            message: "Business maturity registered successfully",
            data: result
        });

    } catch (error) {

        console.error(
            "Business maturity registration error:",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Business maturity already registered"
            });
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to register business maturity"
        });
    }
};

module.exports = {
    registerBusinessMaturity
};
