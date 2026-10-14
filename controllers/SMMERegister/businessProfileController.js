
const {
    createBusinessProfile
} = require("../../UserService/RegisterSMME/businessProfileService");

// =====================================================
// PARSE BOOLEAN VALUES
// =====================================================

const parseBoolean = (value, fieldName) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if ([true, 1, "1", "true"].includes(value)) {
        return 1;
    }

    if ([false, 0, "0", "false"].includes(value)) {
        return 0;
    }

    const error = new Error(
        `Invalid value for ${fieldName}. Use true, false, 1 or 0`
    );

    error.statusCode = 400;
    throw error;
};

// =====================================================
// REGISTER BUSINESS PROFILE
// =====================================================

const registerBusinessProfile = async (req, res) => {

    try {

        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user"
            });
        }

        // =====================================================
        // 1. PARSE BUSINESS PROFILE
        // =====================================================

        let data;

        try {

            data =
                typeof req.body.business_profile === "string"
                    ? JSON.parse(req.body.business_profile)
                    : req.body.business_profile;

        } catch {

            return res.status(400).json({
                success: false,
                message: "Invalid business_profile JSON format"
            });
        }

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return res.status(400).json({
                success: false,
                message: "Business profile data is required"
            });
        }

        // =====================================================
        // 2. VALIDATE REQUIRED FIELDS
        // =====================================================

        if (
            typeof data.business_name !== "string" ||
            !data.business_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Business name is required"
            });
        }

        data.business_name = data.business_name.trim();

        // =====================================================
        // 3. PARSE BOOLEAN FIELDS
        // =====================================================

        const booleanFields = [
            "has_bee_certificate",
            "has_vat_registration",
            "attended_esd_program",
            "received_grant_or_loan"
        ];

        for (const field of booleanFields) {
            data[field] = parseBoolean(data[field], field);
        }

        // =====================================================
        // 4. VALIDATE VAT
        // =====================================================

        if (
            data.has_vat_registration === 1 &&
            !String(data.vat_registration_number ?? "").trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "VAT registration number is required"
            });
        }

        if (data.has_vat_registration === 0) {
            data.vat_registration_number = null;
        }

        // =====================================================
        // 5. VALIDATE OWNERSHIP
        // =====================================================

        const percentageFields = [
            "bwo_ownership_percentage",
            "bo_ownership_percentage"
        ];

        for (const field of percentageFields) {

            if (
                data[field] === undefined ||
                data[field] === null ||
                data[field] === ""
            ) {
                data[field] = null;
                continue;
            }

            const percentage = Number(data[field]);

            if (
                !Number.isFinite(percentage) ||
                percentage < 0 ||
                percentage > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be between 0 and 100`
                });
            }

            data[field] = percentage;
        }

        // =====================================================
        // 6. VALIDATE ESD AND GRANT DETAILS
        // =====================================================

        if (
            data.attended_esd_program === 1 &&
            !String(data.esd_institution ?? "").trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "ESD institution is required"
            });
        }

        if (data.attended_esd_program === 0) {
            data.esd_institution = null;
        }

        if (
            data.received_grant_or_loan === 1 &&
            !String(data.grant_loan_institution ?? "").trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Grant or loan institution is required"
            });
        }

        if (data.received_grant_or_loan === 0) {
            data.grant_loan_institution = null;
        }

        // =====================================================
        // 7. VALIDATE BEE DOCUMENT TYPE
        // =====================================================

        if (
            data.has_bee_certificate === null &&
            req.files?.bee_document?.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Specify whether the BEE document is a certificate or affidavit"
            });
        }

        // =====================================================
        // 8. CALL SERVICE
        // =====================================================

        const result = await createBusinessProfile(
            userId,
            data,
            req.files
        );

        return res.status(201).json({
            success: true,
            message: "Business profile registered successfully",
            data: result
        });

    } catch (error) {

        console.error("Business registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Business profile or company registration number already exists"
            });
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to register business profile"
        });
    }
};

module.exports = {
    registerBusinessProfile
};
