const opportunityResponseService = require("../UserService/opportunityResponseService");

const getResponsesByOpportunityName = async (req, res) => {
    const { name } = req.params;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Opportunity name is required"
        });
    }

    try {
        const responses =
            await opportunityResponseService.getResponsesByOpportunityName(name);

        return res.status(200).json({
            success: true,
            message: "Opportunity responses fetched successfully",
            count: responses.length,
            data: responses
        });

    } catch (error) {

        console.error(
            "Error fetching opportunity responses:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch opportunity responses",
            error: error.message
        });
    }
};

module.exports = {
    getResponsesByOpportunityName
};