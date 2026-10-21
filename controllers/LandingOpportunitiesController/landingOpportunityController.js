const {
    getLatestOpportunities
} = require("../../UserService/LandingOpportunity/landingOpportunityService");

const getLandingOpportunities = async (req, res) => {
    try {
        const { tenders, rfqs } =
            await getLatestOpportunities();

        return res.status(200).json({
            success: true,
            message: "Latest opportunities retrieved successfully",
            total: tenders.length + rfqs.length,
            tenders,
            rfqs
        });

    } catch (error) {
        console.error(
            "Error fetching landing opportunities:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve latest opportunities"
        });
    }
};

module.exports = {
    getLandingOpportunities
};