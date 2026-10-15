
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../../config/database");

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);

const REFRESH_MAX_AGE =
  REFRESH_DAYS * 24 * 60 * 60 * 1000;

// ============================================
// HASH REFRESH TOKEN
// ============================================
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// ============================================
// CREATE JWT ACCESS TOKEN
// ============================================
const createAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role_id: user.role_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
      algorithm: "HS256",
    }
  );
};

// ============================================
// GENERATE RANDOM REFRESH TOKEN
// ============================================
const generateRefreshToken = () =>
  crypto.randomBytes(48).toString("hex");

// ============================================
// REFRESH COOKIE CONFIGURATION
// ============================================
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: REFRESH_MAX_AGE,
});

// ============================================
// CLEAR REFRESH COOKIE CONFIGURATION
// ============================================
const clearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
});

// ============================================
// CREATE REFRESH TOKEN
// ============================================
const createRefreshToken = async (userId) => {
  const token = generateRefreshToken();

  const expiresAt = new Date(
    Date.now() + REFRESH_MAX_AGE
  );

  await db.query(
    `INSERT INTO user_refresh_token
      (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, hashToken(token), expiresAt]
  );

  return token;
};

// ============================================
// ROTATE REFRESH TOKEN
// ============================================
const rotateRefreshToken = async (oldToken) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Retrieve refresh session and user details
    const [rows] = await connection.query(
      `SELECT
        rt.refresh_token_id,
        u.user_id,
        u.role_id,
        u.first_name,
        u.last_name,
        u.id_number,
        u.phone_number,
        u.email,
        u.status
       FROM user_refresh_token rt
       INNER JOIN user u
         ON u.user_id = rt.user_id
       WHERE rt.token_hash = ?
         AND rt.revoked_at IS NULL
         AND rt.expires_at > UTC_TIMESTAMP()
       FOR UPDATE`,
      [hashToken(oldToken)]
    );

    // Validate refresh session
    if (
      !rows.length ||
      rows[0].status !== "ACTIVE"
    ) {
      await connection.rollback();
      return null;
    }

    const user = rows[0];

    // Generate replacement refresh token
    const newToken = generateRefreshToken();

    const expiresAt = new Date(
      Date.now() + REFRESH_MAX_AGE
    );

    // Revoke previous refresh token
    await connection.query(
      `UPDATE user_refresh_token
       SET revoked_at = UTC_TIMESTAMP()
       WHERE refresh_token_id = ?`,
      [user.refresh_token_id]
    );

    // Save new refresh token
    await connection.query(
      `INSERT INTO user_refresh_token
        (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [
        user.user_id,
        hashToken(newToken),
        expiresAt,
      ]
    );

    await connection.commit();

    // Return new tokens and updated user details
    return {
      accessToken: createAccessToken(user),

      refreshToken: newToken,

      user: {
        user_id: user.user_id,
        role_id: user.role_id,
        first_name: user.first_name,
        last_name: user.last_name,
        id_number: user.id_number,
        phone_number: user.phone_number,
        email: user.email,
      },
    };

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

// ============================================
// REVOKE REFRESH TOKEN
// ============================================
const revokeRefreshToken = async (token) => {
  await db.query(
    `UPDATE user_refresh_token
     SET revoked_at = UTC_TIMESTAMP()
     WHERE token_hash = ?
       AND revoked_at IS NULL`,
    [hashToken(token)]
  );
};

// ============================================
// EXPORT FUNCTIONS
// ============================================
module.exports = {
  createAccessToken,
  createRefreshToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
  rotateRefreshToken,
  revokeRefreshToken,
};
