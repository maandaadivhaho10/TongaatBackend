const {
  getRegistrationStatus
} = require("../../UserService/RegisterSMME/registrationStatusService");

const checkRegistrationStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const status = await getRegistrationStatus(userId);

    return res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error("Registration status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check registration status"
    });
  }
};

module.exports = { checkRegistrationStatus };