
const {
  updateUserStatusService,
  updateUserRoleService,
} = require("../../UserService/SuperAdmin/superAdminUserActionsService");

// ======================================================
// UPDATE USER STATUS
// ======================================================

const updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { status } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    // Assumes authenticateToken sets req.user.user_id.
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await updateUserStatusService(
      userId,
      status,
      currentUserId
    );

    return res.status(200).json({
      success: true,
      message: `User ${status.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : "Failed to update user status",
    });
  }
};

// ======================================================
// UPDATE USER ROLE
// ======================================================

const updateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const roleId = Number(req.body.role_id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (![1, 2, 3, 4].includes(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await updateUserRoleService(
      userId,
      roleId,
      currentUserId
    );

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : "Failed to update user role",
    });
  }
};

module.exports = {
  updateUserStatus,
  updateUserRole,
};
