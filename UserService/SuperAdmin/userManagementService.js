const db = require("../../config/database");
const bcrypt = require("bcryptjs");

const ALLOWED_ROLES = [1, 2, 3];

const createManagedUser = async (userData, createdBy) => {
  const {
    title,
    first_name,
    last_name,
    id_number,
    gender,
    phone_number,
    email,
    password,
    role_id,
  } = userData;

  const roleId = Number(role_id);

  if (!ALLOWED_ROLES.includes(roleId)) {
    const error = new Error(
      "Invalid role. Only Supplier, ED Team and Admin accounts can be created."
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    !title ||
    !first_name ||
    !last_name ||
    !id_number ||
    !email ||
    !password
  ) {
    const error = new Error("Required fields are missing");
    error.statusCode = 400;
    throw error;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    const error = new Error("Invalid email address");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error(
      "Password must contain at least 8 characters"
    );
    error.statusCode = 400;
    throw error;
  }

  let connection;

  try {
    connection = await db.getConnection();

    const [existingUsers] = await connection.query(
      `
      SELECT user_id
      FROM \`user\`
      WHERE email = ? OR id_number = ?
      LIMIT 1
      `,
      [email.trim().toLowerCase(), id_number]
    );

    if (existingUsers.length > 0) {
      const error = new Error(
        "A user with this email or ID number already exists"
      );
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO \`user\` (
        role_id,
        title,
        first_name,
        last_name,
        id_number,
        gender,
        phone_number,
        email,
        password_hash,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        roleId,
        title,
        first_name,
        last_name,
        id_number,
        gender || null,
        phone_number || null,
        email.trim().toLowerCase(),
        passwordHash,
        "ACTIVE",
      ]
    );

    const userId = result.insertId;

    // Log the action within the same transaction.
    // This ensures the user and audit log are saved together.
    await connection.query(
      `
      INSERT INTO activity_log (
        user_id,
        action,
        module,
        description,
        entity_type,
        entity_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        createdBy,
        "CREATE",
        "USER_MANAGEMENT",
        `Created user account with role ID ${roleId}`,
        "user",
        String(userId),
      ]
    );

    await connection.commit();

    return {
      user_id: userId,
      role_id: roleId,
      title,
      first_name,
      last_name,
      id_number,
      gender: gender || null,
      phone_number: phone_number || null,
      email: email.trim().toLowerCase(),
      status: "ACTIVE",
    };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    if (error.code === "ER_DUP_ENTRY") {
      error.statusCode = 409;
      error.message = "Email or ID number already exists";
    }

    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createManagedUser,
};