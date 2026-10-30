const {
  createManagedUser,
} = require(
  "../../UserService/SuperAdmin/userManagementService"
);

const createUser = async (req, res) => {
  try {
    const createdBy = req.user.user_id;

    const user = await createManagedUser(
      req.body,
      createdBy
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode || error.code === "ER_DUP_ENTRY"
          ? error.message
          : "Unable to create user",
    });
  }
};

module.exports = {
  createUser,
};