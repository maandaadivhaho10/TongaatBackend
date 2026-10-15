
const authService = require("../UserService/authService");
const db = require("../config/database");

const {
  createRefreshToken,
  refreshCookieOptions,
} = require("../UserService/RefreshToken/refreshTokenService");

// ======================================================
// LOGIN CONTROLLER
// ======================================================

const login = async (req, res) => {
  let connection;

  try {
    const { email, password } = req.body;

    // ==================================================
    // VALIDATE INPUT
    // ==================================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ==================================================
    // DATABASE CONNECTION
    // ==================================================

    connection = await db.getConnection();

    // ==================================================
    // AUTHENTICATE USER
    // ==================================================

    const result = await authService.loginUser(
      connection,
      email,
      password
    );

    // Expected result:
    // {
    //   token: "...",
    //   user: {
    //     user_id: 1,
    //     role_id: 1,
    //     first_name: "...",
    //     last_name: "...",
    //     email: "..."
    //   }
    // }

    if (!result?.user?.user_id || !result?.token) {
      throw new Error("Invalid authentication service response");
    }

    // ==================================================
    // GENERATE REFRESH TOKEN
    // ==================================================

    const refreshToken = await createRefreshToken(
      result.user.user_id
    );

    // ==================================================
    // STORE REFRESH TOKEN IN HTTPONLY COOKIE
    // ==================================================

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions()
    );

    // ==================================================
    // RETURN LOGIN RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        ...result,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  } finally {
    // ==================================================
    // RELEASE DATABASE CONNECTION
    // ==================================================

    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  login,
};
