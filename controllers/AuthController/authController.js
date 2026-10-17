
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

    // Retrieve user including gender
    const [rows] = await db.query(
      `SELECT
          user_id,
          role_id,
          first_name,
          last_name,
          id_number,
          gender,
          phone_number,
          email,
          password_hash,
          status
       FROM \`user\`
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

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const accessToken = createAccessToken(user);

    const refreshToken = await createRefreshToken(
      user.user_id
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions()
    );

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
          gender: user.gender,
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

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions()
    );

    // Retrieve current user details, including gender
    const [rows] = await db.query(
      `SELECT
          user_id,
          role_id,
          first_name,
          last_name,
          id_number,
          gender,
          phone_number,
          email,
          status
       FROM \`user\`
       WHERE user_id = ?
       LIMIT 1`,
      [result.user.user_id]
    );

    if (
      !rows.length ||
      rows[0].status !== "ACTIVE"
    ) {
      res.clearCookie(
        "refreshToken",
        clearRefreshCookieOptions()
      );

      return res.status(401).json({
        success: false,
        message: "User session is no longer valid",
      });
    }

    const user = rows[0];

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",

      token: result.accessToken,

      user: {
        user_id: user.user_id,
        role_id: user.role_id,
        first_name: user.first_name,
        last_name: user.last_name,
        id_number: user.id_number,
        gender: user.gender,
        phone_number: user.phone_number,
        email: user.email,
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
    if (token) {
      await revokeRefreshToken(token);
    }

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
          gender,
          phone_number,
          email,
          status
       FROM \`user\`
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.user_id]
    );

    if (
      !rows.length ||
      rows[0].status !== "ACTIVE"
    ) {
      return res.status(401).json({
        success: false,
        message: "User session is no longer valid",
      });
    }

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
