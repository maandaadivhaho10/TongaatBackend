const workshopService = require("../UserService/workshopService");

const createWorkshop = async (req, res) => {
    try {
        const {
            title,
            description,
            workshop_date,
            workshop_time,
            location,
            target_role_id,
            created_by
        } = req.body;

        // Validate required fields
        if (
            !title ||
            !workshop_date ||
            !workshop_time ||
            !target_role_id ||
            !created_by
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, date, time, target role and creator are required"
            });
        }

        const workshop = await workshopService.createWorkshop({
            title,
            description,
            workshop_date,
            workshop_time,
            location,
            target_role_id,
            created_by
        });

        return res.status(201).json({
            success: true,
            message: "Workshop created successfully",
            data: workshop
        });

    } catch (error) {
        console.error("Create workshop error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create workshop",
            error: error.message
        });
    }
};

module.exports = {
    createWorkshop
};