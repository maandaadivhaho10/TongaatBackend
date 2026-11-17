
const axios = require("axios");
const crypto = require("crypto");

const verifyCipcCompany = async (registrationNumber) => {
    const apiKey = process.env.VERIFYNOW_API_KEY;
    const apiUrl = process.env.VERIFYNOW_CIPC_URL;
    const mode = process.env.VERIFYNOW_MODE || "production";

    if (!apiKey || !apiUrl) {
        throw new Error("Missing VerifyNow API configuration");
    }

    const headers = {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
    };

    // Production POST requests require an idempotency key.
    if (mode === "production") {
        headers["Idempotency-Key"] = crypto.randomUUID();
    }

    const payload = {
        reportType: "cipc_company_match",
        registration_number: registrationNumber,
        mode,
    };

    try {
        console.log("Sending CIPC verification request...");
        console.log("Mode:", mode);
        console.log("Endpoint:", apiUrl);
        console.log("Registration number:", registrationNumber);

        const response = await axios.post(apiUrl, payload, {
            headers,
            timeout: 30000,
        });

        console.log("VerifyNow HTTP status:", response.status);
        console.log("VerifyNow response:", response.data);

        return response.data;

    } catch (error) {
        console.error("========== VERIFYNOW ERROR ==========");

        if (error.response) {
            console.error("HTTP status:", error.response.status);
            console.error("Provider response:", error.response.data);
            console.error("Provider headers:", {
                "retry-after": error.response.headers["retry-after"],
                "content-type": error.response.headers["content-type"],
            });
        } else if (error.request) {
            console.error("No response received from VerifyNow");
            console.error("Network error:", error.code);
            console.error("Message:", error.message);
        } else {
            console.error("Request configuration error:", error.message);
        }

        console.error("=====================================");

        throw error;
    }
};

module.exports = { verifyCipcCompany };
