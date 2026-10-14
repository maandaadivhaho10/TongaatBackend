const {
    createAdvisoryService,getAllBusinessAdvisoryRequests
} = require("../../UserService/BissnessAdvisory/advisoryService");


const createAdvisoryRequest = async (req, res) => {
    try {
        console.log("Advisory request received");

        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        const {
            subject,
            description,
            request_date,
            preferred_date
        } = req.body;

        if (
            typeof subject !== "string" ||
            !subject.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject and description are required"
            });
        }

        const date = request_date ||
            new Date().toISOString().split("T")[0];

        const isValidDate = (value) =>
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value;

        if (!isValidDate(date) ||
            (preferred_date != null && !isValidDate(preferred_date))) {
            return res.status(400).json({
                success: false,
                message: "Dates must be valid YYYY-MM-DD values"
            });
        }

        console.log("Creating advisory request for:", user_id);

        const result = await createAdvisoryService({
            user_id,
            subject: subject.trim(),
            description: description.trim(),
            request_date: date,
            preferred_date: preferred_date ?? null
        });

        console.log("Advisory created successfully");

        return res.status(201).json({
            success: true,
            message: "Business advisory request submitted successfully",
            data: result
        });

    } catch (error) {
        console.error("Advisory request error:", error);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Authenticated user does not exist"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to submit advisory request"
        });
    }
};



const getAllAdvisoryRequests = async (req, res) => {
    try {
        const requests = await getAllBusinessAdvisoryRequests();

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
       console.error("================================");
    console.error("BUSINESS ADVISORY API ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("SQL Message:", error.sqlMessage);
    console.error("SQL:", error.sql);
    console.error("================================");

    return res.status(500).json({
        success: false,
        message: "Failed to fetch business advisory requests",
        error: process.env.NODE_ENV === "production"
            ? undefined
            : error.sqlMessage || error.message
    });

        return res.status(500).json({
            success: false,
            message: "Failed to fetch business advisory requests"
        });
    }
};


module.exports = {
    createAdvisoryRequest,getAllAdvisoryRequests
};