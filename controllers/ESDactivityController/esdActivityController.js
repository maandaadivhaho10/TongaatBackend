
const activityService = require(
  "../../UserService/ESDActivities/esdActivityService"
);

const VALID_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
];

const validDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validateFields = (body) => {
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 150
  ) {
    return "Event name is required (maximum 150 characters).";
  }

  if (
    typeof body.description !== "string" ||
    !body.description.trim()
  ) {
    return "Event description is required.";
  }

  if (!validDate(body.activity_date)) {
    return "A valid activity_date (YYYY-MM-DD) is required.";
  }

  if (
    !VALID_STATUSES.includes(body.status || "SCHEDULED")
  ) {
    return "Invalid activity status.";
  }

  return null;
};

// ============================================
// CREATE
// ============================================

const createActivity = async (req, res) => {
  try {
    const error = validateFields(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    // Set by authenticateToken middleware.
    // Adjust this line if your JWT middleware
    // stores the authenticated user elsewhere.
    const created_by = Number(req.user?.user_id);

    if (!Number.isInteger(created_by) || created_by <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID is missing.",
      });
    }

    const activity = await activityService.createActivity({
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      activity_date: req.body.activity_date,
      created_by,
    });

    return res.status(201).json({
      success: true,
      message: "ESD activity created successfully.",
      data: activity,
    });
  } catch (error) {
    console.error("Create ESD activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ESD activity.",
    });
  }
};

// ============================================
// GET ALL
// ============================================

const getAllActivities = async (req, res) => {
  try {
    const activities =
      await activityService.getAllActivities();

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Get ESD activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ESD activities.",
    });
  }
};

// ============================================
// GET ONE
// ============================================

const getActivityById = async (req, res) => {
  try {
    const activity =
      await activityService.getActivityById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "ESD activity not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Get ESD activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ESD activity.",
    });
  }
};

// ============================================
// UPDATE
// ============================================

const updateActivity = async (req, res) => {
  try {
    const id = req.params.id;

    const existing =
      await activityService.getActivityById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "ESD activity not found.",
      });
    }

    const updatedFields = {
      name: req.body.name ?? existing.name,
      description:
        req.body.description ?? existing.description,
      activity_date:
        req.body.activity_date ?? existing.activity_date,
      status: req.body.status ?? existing.status,
    };

    const error = validateFields(updatedFields);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const updated = await activityService.updateActivity(
      id,
      {
        name: updatedFields.name.trim(),
        description: updatedFields.description.trim(),
        activity_date: updatedFields.activity_date,
        status: updatedFields.status,
      }
    );

    return res.status(200).json({
      success: true,
      message: "ESD activity updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update ESD activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ESD activity.",
    });
  }
};

// ============================================
// DELETE
// ============================================

const deleteActivity = async (req, res) => {
  try {
    const deleted =
      await activityService.deleteActivity(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "ESD activity not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "ESD activity deleted successfully.",
    });
  } catch (error) {
    console.error("Delete ESD activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete ESD activity.",
    });
  }
};

module.exports = {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
};
