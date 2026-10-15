
const bcrypt = require("bcrypt");
const db = require("../../config/database");

const {
  createAccessToken,
  createRefreshToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
  rotateRefreshToken,
  revokeRefreshToken,
} = require("../../UserService/RefreshToken/refreshTokenService");

// ============================================
// LOGIN USER
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Retrieve user including ID and phone number
    const [rows] = await db.query(
      `SELECT
          user_id,
          role_id,
          first_name,
          last_name,
          id_number,
          phone_number,
          email,
          password_hash,
          status
       FROM user
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // Generate access and refresh tokens
    const accessToken = createAccessToken(user);

    const refreshToken = await createRefreshToken(
      user.user_id
    );

    // Save refresh token in HttpOnly cookie
    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions()
    );

    // Return access token and user information
    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        token: accessToken,

        user: {
          user_id: user.user_id,
          role_id: user.role_id,
          first_name: user.first_name,
          last_name: user.last_name,
          id_number: user.id_number,
          phone_number: user.phone_number,
          email: user.email,
        },
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

// ============================================
// REFRESH ACCESS TOKEN
// ============================================
const refreshAccessToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
    });
  }

  try {
    // Validate old refresh token and rotate it
    const result = await rotateRefreshToken(token);

    if (!result) {
      res.clearCookie(
        "refreshToken",
        clearRefreshCookieOptions()
      );

      return res.status(401).json({
        success: false,
        message: "Refresh session expired or invalid",
      });
    }

    // Store new refresh token
    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions()
    );

    // Return new access token and user details
    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",

      token: result.accessToken,

      user: {
        user_id: result.user.user_id,
        role_id: result.user.role_id,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
        id_number: result.user.id_number,
        phone_number: result.user.phone_number,
        email: result.user.email,
      },
    });

  } catch (error) {
    console.error("Refresh error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh session",
    });
  }
};

// ============================================
// LOGOUT USER
// ============================================
const logoutUser = async (req, res) => {
  const token = req.cookies?.refreshToken;

  try {
    // Revoke refresh token in database
    if (token) {
      await revokeRefreshToken(token);
    }

    // Remove refresh cookie
    res.clearCookie(
      "refreshToken",
      clearRefreshCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete logout",
    });
  }
};

// ============================================
// GET CURRENT AUTHENTICATED USER
// ============================================
const getCurrentUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          user_id,
          role_id,
          first_name,
          last_name,
          id_number,
          phone_number,
          email,
          status
       FROM user
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.user_id]
    );

    // Validate user account
    if (
      !rows.length ||
      rows[0].status !== "ACTIVE"
    ) {
      return res.status(401).json({
        success: false,
        message: "User session is no longer valid",
      });
    }

    // Exclude internal account status
    const { status, ...user } = rows[0];

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user",
    });
  }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================
module.exports = {
  login,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
};
