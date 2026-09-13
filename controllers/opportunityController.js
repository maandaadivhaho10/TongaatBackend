const opportunityService =
    require("../UserService/opportunityService");


// ==========================================
// CREATE OPPORTUNITY
// ==========================================

const createOpportunity = async (req, res) => {

    try {

        const {
            title,
            description,
            opportunity_type,
            closing_date,
            location,
            target_role_id,
            published_by
        } = req.body;

        if (
            !title ||
            !description ||
            !target_role_id ||
            !published_by
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, description, target_role_id and published_by are required"
            });
        }

        const opportunity =
            await opportunityService.createOpportunity(
                {
                    title,
                    description,
                    opportunity_type,
                    closing_date,
                    location,
                    target_role_id,
                    published_by
                },
                req.file
            );

        return res.status(201).json({
            success: true,
            message: "Opportunity created successfully",
            data: opportunity
        });

    } catch (error) {

        console.error(
            "Create opportunity error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create opportunity",
            error: error.message
        });
    }
};


// ==========================================
// GET BY TARGET ROLE ID
// ==========================================

const getOpportunitiesByTargetId = async (req, res) => {

    try {

        const { targetId } = req.params;

        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: "Target role ID is required"
            });
        }

        const opportunities =
            await opportunityService
                .getOpportunitiesByTargetId(targetId);

        return res.status(200).json({
            success: true,
            message: "Opportunities retrieved successfully",
            data: opportunities
        });

    } catch (error) {

        console.error(
            "Get opportunities by target ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve opportunities",
            error: error.message
        });
    }
};


module.exports = {
    createOpportunity,
    getOpportunitiesByTargetId
};