const db = require("../../config/database");

// =============================================
// SAVE ACTIVITY
// =============================================

const createActivityLog = async ({
  user_id,
  action,
  module,
  description,
  entity_type = null,
  entity_id = null,
  ip_address = null,
}) => {
  if (!user_id || !action || !module) {
    throw new Error(
      "user_id, action and module are required"
    );
  }

  const [result] = await db.query(
    `
    INSERT INTO activity_log (
      user_id,
      action,
      module,
      description,
      entity_type,
      entity_id,
      ip_address
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user_id,
      action,
      module,
      description,
      entity_type,
      entity_id,
      ip_address,
    ]
  );

  return result.insertId;
};

// =============================================
// GET ACTIVITY LOGS WITH FILTERS
// =============================================

const getActivityLogs = async ({
  page = 1,
  limit = 10,
  role_id,
  user_id,
  module,
  action,
  start_date,
  end_date,
}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(
    100,
    Math.max(1, parseInt(limit, 10) || 10)
  );

  const offset = (page - 1) * limit;

  let where = `
    WHERE u.role_id IN (2, 3, 4)
  `;

  const params = [];

  if (role_id) {
    where += " AND u.role_id = ?";
    params.push(role_id);
  }

  if (user_id) {
    where += " AND a.user_id = ?";
    params.push(user_id);
  }

  if (module) {
    where += " AND a.module = ?";
    params.push(module);
  }

  if (action) {
    where += " AND a.action = ?";
    params.push(action);
  }

  if (start_date) {
    where += " AND a.created_at >= ?";
    params.push(`${start_date} 00:00:00`);
  }

  if (end_date) {
    where += " AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)";
    params.push(end_date);
  }

  const [countRows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM activity_log a
    JOIN \`user\` u ON a.user_id = u.user_id
    ${where}
    `,
    params
  );

  const [rows] = await db.query(
    `
    SELECT
      a.log_id,
      a.user_id,
      CONCAT(u.first_name, ' ', u.last_name)
        AS full_name,
      u.email,
      u.role_id,
      r.role_name,
      a.action,
      a.module,
      a.description,
      a.entity_type,
      a.entity_id,
      a.ip_address,
      a.created_at
    FROM activity_log a
    JOIN \`user\` u ON a.user_id = u.user_id
    JOIN role r ON u.role_id = r.role_id
    ${where}
    ORDER BY a.created_at DESC, a.log_id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  const total = countRows[0].total;

  return {
    logs: rows,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
};

// =============================================
// GET ACTIVITY SUMMARY
// =============================================

const getActivitySummary = async () => {
  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS total_activities,

      SUM(
        CASE WHEN u.role_id = 2 THEN 1 ELSE 0 END
      ) AS ed_team_activities,

      SUM(
        CASE WHEN u.role_id = 3 THEN 1 ELSE 0 END
      ) AS admin_activities,

      SUM(
        CASE WHEN u.role_id = 4 THEN 1 ELSE 0 END
      ) AS super_admin_activities,

      SUM(
        CASE
          WHEN a.created_at >= CURDATE()
          THEN 1 ELSE 0
        END
      ) AS today_activities

    FROM activity_log a
    JOIN \`user\` u ON a.user_id = u.user_id
    WHERE u.role_id IN (2, 3, 4)
  `);

  return rows[0];
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getActivitySummary,
};