
const db = require("../../config/database");

// ======================================================
// UPDATE USER STATUS
// ======================================================

const updateUserStatusService = async (
  targetUserId,
  newStatus,
  currentUserId
) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Lock Super Admin accounts during changes.
    // This helps protect the last active Super Admin.
    const [admins] = await connection.query(
      `SELECT user_id
       FROM user
       WHERE role_id = 4
       ORDER BY user_id
       FOR UPDATE`
    );

    const [users] = await connection.query(
      `SELECT user_id, role_id, status
       FROM user
       WHERE user_id = ?
       FOR UPDATE`,
      [targetUserId]
    );

    if (users.length === 0) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const user = users[0];

    if (Number(targetUserId) === Number(currentUserId)) {
      const error = new Error(
        "You cannot change your own account status"
      );
      error.statusCode = 403;
      throw error;
    }

    if (user.role_id === 4 && newStatus === "INACTIVE") {
      const [activeAdmins] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM user
         WHERE role_id = 4 AND status = 'ACTIVE'`
      );

      if (Number(activeAdmins[0].total) <= 1) {
        const error = new Error(
          "Cannot deactivate the last active Super Admin"
        );
        error.statusCode = 409;
        throw error;
      }
    }

    await connection.query(
      `UPDATE user
       SET status = ?
       WHERE user_id = ?`,
      [newStatus, targetUserId]
    );

    // Invalidate refresh tokens if the account is disabled.
    if (newStatus === "INACTIVE") {
      await connection.query(
        `DELETE FROM user_refresh_token
         WHERE user_id = ?`,
        [targetUserId]
      );
    }

    await connection.commit();

    return {
      user_id: Number(targetUserId),
      status: newStatus,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ======================================================
// UPDATE USER ROLE
// ======================================================

const updateUserRoleService = async (
  targetUserId,
  newRoleId,
  currentUserId
) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Lock all Super Admin accounts consistently.
    await connection.query(
      `SELECT user_id
       FROM user
       WHERE role_id = 4
       ORDER BY user_id
       FOR UPDATE`
    );

    const [users] = await connection.query(
      `SELECT user_id, role_id, status
       FROM user
       WHERE user_id = ?
       FOR UPDATE`,
      [targetUserId]
    );

    if (users.length === 0) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const user = users[0];

    if (Number(targetUserId) === Number(currentUserId)) {
      const error = new Error(
        "You cannot change your own role"
      );
      error.statusCode = 403;
      throw error;
    }

    const [roles] = await connection.query(
      `SELECT role_id
       FROM role
       WHERE role_id = ?`,
      [newRoleId]
    );

    if (roles.length === 0) {
      const error = new Error("Invalid role");
      error.statusCode = 400;
      throw error;
    }

    if (user.role_id === 4 && newRoleId !== 4) {
      const [activeAdmins] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM user
         WHERE role_id = 4 AND status = 'ACTIVE'`
      );

      if (
        user.status === "ACTIVE" &&
        Number(activeAdmins[0].total) <= 1
      ) {
        const error = new Error(
          "Cannot remove the last active Super Admin"
        );
        error.statusCode = 409;
        throw error;
      }
    }

    await connection.query(
      `UPDATE user
       SET role_id = ?
       WHERE user_id = ?`,
      [newRoleId, targetUserId]
    );

    // Revoke refresh tokens after a role change.
    await connection.query(
      `DELETE FROM user_refresh_token
       WHERE user_id = ?`,
      [targetUserId]
    );

    await connection.commit();

    return {
      user_id: Number(targetUserId),
      role_id: newRoleId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  updateUserStatusService,
  updateUserRoleService,
};
