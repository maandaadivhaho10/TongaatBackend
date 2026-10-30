const {
  getActivityLogs,
  getActivitySummary,
} = require(
  "../../UserService/ActivityLogs/activityLogService"
);

// =============================================
// GET ALL ACTIVITY LOGS
// =============================================

const fetchActivityLogs = async (req, res) => {
  try {
    const result = await getActivityLogs(req.query);

    return res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully",
      data: result.logs,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error("Fetch activity logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};

// =============================================
// GET ACTIVITY SUMMARY
// =============================================

const fetchActivitySummary = async (req, res) => {
  try {
    const summary = await getActivitySummary();

    return res.status(200).json({
      success: true,
      data: summary,
    });

  } catch (error) {
    console.error("Activity summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity summary",
    });
  }
};

module.exports = {
  fetchActivityLogs,
  fetchActivitySummary,
};