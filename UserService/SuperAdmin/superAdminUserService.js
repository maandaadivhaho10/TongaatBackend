
const db = require("../../config/database");

// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsersService = async ({
  page = 1,
  limit = 10,
  search = "",
  role_id = "",
  status = "",
}) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const offset = (currentPage - 1) * pageSize;

  const conditions = [];
  const params = [];

  // SEARCH
  if (search.trim()) {
    conditions.push(`
      (
        u.first_name LIKE ?
        OR u.last_name LIKE ?
        OR u.email LIKE ?
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
      )
    `);

    const searchValue = `%${search.trim()}%`;
    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  // ROLE FILTER
  if (role_id !== "") {
    conditions.push("u.role_id = ?");
    params.push(Number(role_id));
  }

  // STATUS FILTER
  if (status !== "") {
    conditions.push("u.status = ?");
    params.push(status);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // TOTAL COUNT
  const [countRows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM user u
      ${whereClause}
    `,
    params
  );

  const total = Number(countRows[0].total);

  // FETCH USERS
  const [users] = await db.query(
    `
      SELECT
        u.user_id,
        u.role_id,
        r.role_name,
        u.title,
        u.first_name,
        u.last_name,
        u.gender,
        u.phone_number,
        u.email,
        u.status,
        u.created_at
      FROM user u
      INNER JOIN role r ON u.role_id = r.role_id
      ${whereClause}
      ORDER BY u.created_at DESC, u.user_id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset]
  );

  return {
    users,
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      total_pages: Math.ceil(total / pageSize),
    },
  };
};

module.exports = {
  getAllUsersService,
};
