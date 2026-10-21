const {
  getDashboardStatistics,getRegisteredSuppliersCount
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
    


const getSupplierCount = async (req, res) => {
    try {
        const total = await getRegisteredSuppliersCount();

        return res.status(200).json({
            success: true,
            message: "Registered suppliers count retrieved successfully",
            total_registered_suppliers: total
        });

    } catch (error) {
        console.error("Supplier count error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve registered suppliers count"
        });
    }
};


module.exports = {
  fetchDashboardStatistics,getSupplierCount
};