
const tonnageService = require("../UserService/tonnageservice");

// Add tonnage
const createTonnage = async (req, res) => {
    try {
        const {
            user_id,
            submission_date,
            tonnage,
            crop_type,
            farm_location,
            notes
        } = req.body;

        if (!user_id || !submission_date || tonnage === undefined) {
            return res.status(400).json({
                success: false,
                message: "user_id, submission_date and tonnage are required"
            });
        }

        const tonnageId = await tonnageService.createTonnageSubmission({
            user_id,
            submission_date,
            tonnage,
            crop_type,
            farm_location,
            notes
        });

        res.status(201).json({
            success: true,
            message: "Tonnage submitted successfully",
            tonnage_id: tonnageId
        });

    } catch (error) {
        console.error("Create tonnage error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit tonnage"
        });
    }
};


// Get all tonnage
const getAllTonnage = async (req, res) => {
    try {
        const submissions =
            await tonnageService.getAllTonnageSubmissions();

        res.status(200).json({
            success: true,
            data: submissions
        });

    } catch (error) {
        console.error("Get tonnage error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get tonnage submissions"
        });
    }
};

// Get tonnage by user ID
const getTonnageByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;

        const submissions =
            await tonnageService.getTonnageByUserId(user_id);

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });

    } catch (error) {
        console.error("Get tonnage by user ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get tonnage submissions"
        });
    }
};
module.exports = {
    createTonnage,
    getAllTonnage,
    getTonnageByUserId
};