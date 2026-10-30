
const {
  getDashboardStatsService
} = require("../../UserService/SuperAdmin/superAdminService");

const getDashboardStats = async (req, res) => {
  try {
    const data = await getDashboardStatsService();

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data
    });

  } catch (error) {
    console.error("Super Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
};

module.exports = {
  getDashboardStats
};
