
const db = require("../../config/database");

const getDashboardStatsService = async () => {
  const [userStats] = await db.query(`
    SELECT
      COUNT(*) AS total_users,
      SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) AS total_smmes,
      SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) AS total_ed_team,
      SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) AS total_admins,
      SUM(CASE WHEN role_id = 4 THEN 1 ELSE 0 END) AS total_super_admins,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_users,
      SUM(CASE WHEN status <> 'ACTIVE' THEN 1 ELSE 0 END) AS inactive_users
    FROM user
  `);

  const [businessStats] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM business_profile)
        AS registered_businesses,
      (SELECT COUNT(*) FROM business_maturity)
        AS completed_maturity
  `);

  const [opportunityStats] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM tenderopportunity)
        AS total_tenders,
      (SELECT COUNT(*) FROM rfqopportunity)
        AS total_rfqs,
      (SELECT COUNT(*) FROM tenderopportunity
       WHERE status = 'OPEN')
        AS open_tenders,
      (SELECT COUNT(*) FROM rfqopportunity
       WHERE status = 'OPEN')
        AS open_rfqs
  `);

  const [advisoryStats] = await db.query(`
    SELECT
      COUNT(*) AS total_advisory_requests,
      SUM(CASE WHEN status = 'PENDING'
        THEN 1 ELSE 0 END) AS pending_advisory_requests
    FROM business_advisory_request
  `);

  const [recentUsers] = await db.query(`
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.status,
      u.created_at,
      r.role_name
    FROM user u
    INNER JOIN role r ON u.role_id = r.role_id
    ORDER BY u.created_at DESC, u.user_id DESC
    LIMIT 5
  `);

  return {
    users: userStats[0],
    businesses: businessStats[0],
    opportunities: opportunityStats[0],
    advisory: advisoryStats[0],
    recent_users: recentUsers
  };
};

module.exports = {
  getDashboardStatsService
};
