
const {
  getAllUsersService,
} = require("../../UserService/SuperAdmin/superAdminUserService");

// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      role_id = "",
      status = "",
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    if (
      role_id !== "" &&
      !["1", "2", "3", "4"].includes(String(role_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role_id",
      });
    }

    if (
      status !== "" &&
      !["ACTIVE", "INACTIVE"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status",
      });
    }

    if (
      typeof search !== "string" ||
      search.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid search value",
      });
    }

    const result = await getAllUsersService({
      page: pageNumber,
      limit: limitNumber,
      search,
      role_id,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

module.exports = {
  getAllUsers,
};
