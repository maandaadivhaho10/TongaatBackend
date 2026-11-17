
const cipcService = require("../../UserService/VerifyCompany/cipcService");

const verifyCompany = async (req, res) => {
    try {
        const { registration_number } = req.body;

        // 1. Validate required input
        if (!registration_number || typeof registration_number !== "string") {
            return res.status(400).json({
                success: false,
                message: "Company registration number is required",
            });
        }

        const registrationNumber = registration_number
            .trim()
            .toUpperCase();

        // 2. Validate South African company registration format
        // Supports YYYY/NNNNNN/NN and KYYYY/NNNNNN/NN
        const registrationRegex = /^K?\d{4}\/\d{6}\/\d{2}$/;

        if (!registrationRegex.test(registrationNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company registration number format. Expected YYYY/NNNNNN/NN",
            });
        }

        // 3. Call VerifyNow service
        const result = await cipcService.verifyCipcCompany(
            registrationNumber
        );

        const company = result?.results;

        // 4. Check whether VerifyNow successfully processed the request
        if (
            result?.success !== true ||
            company?.success !== true ||
            !company?.registration_number
        ) {
            return res.status(200).json({
                success: true,
                verified: false,
                registered: false,
                message: "VerifyNow could not confirm the company registration.",
                data: null,
            });
        }

        // 5. Compare submitted registration number with provider result
        const returnedRegistrationNumber = company.registration_number
            .trim()
            .toUpperCase();

        const isMatch =
            returnedRegistrationNumber === registrationNumber;

        // 6. Return mismatch information
        if (!isMatch) {
            return res.status(200).json({
                success: true,
                verified: false,
                registered: false,
                match: false,
                mode: result.mode,
                message:
                    result.mode === "sandbox"
                        ? "Sandbox returned mock company information. The returned registration number does not match the submitted number."
                        : "Company information was returned, but the registration number does not match.",
                submitted_registration_number: registrationNumber,
                returned_registration_number: returnedRegistrationNumber,
                data: {
                    company_name: company.company_name,
                    registration_number: returnedRegistrationNumber,
                    company_status: company.status,
                    registration_date: company.registration_date,
                },
            });
        }

        // 7. Confirm company registration
        return res.status(200).json({
            success: true,
            verified: true,
            registered: true,
            match: true,
            message: "Company registration successfully verified with CIPC",
            data: {
                company_name: company.company_name,
                registration_number: returnedRegistrationNumber,
                company_status: company.status,
                registration_date: company.registration_date,
                company_type: company.company_type,
                business_description: company.business_description,
                email: company.email,
                telephone: company.telephone,
            },
        });

    } catch (error) {
        console.error("CIPC Controller Error:", error.message);

        if (error.response) {
            return res.status(502).json({
                success: false,
                message: "VerifyNow API request failed",
                provider_status: error.response.status,
                provider_error: error.response.data,
            });
        }

        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                success: false,
                message: "VerifyNow API request timed out",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    verifyCompany,
};
