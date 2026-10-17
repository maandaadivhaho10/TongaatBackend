const {
  getDashboardStatistics
} = require(
  "../../UserService/DashboardStats/dashboardStatsService"
);

const fetchDashboardStatistics = async (req, res) => {
  try {

    const statistics = await getDashboardStatistics();

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: statistics
    });

  } catch (error) {

    console.error(
      "Error fetching dashboard statistics:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics"
    });

  }
};

module.exports = {
  fetchDashboardStatistics
};