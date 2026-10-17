
const db = require("../../config/database");

const getDashboardStatistics = async () => {
  const connection = await db.getConnection();

  try {
    const queries = {
      // Total RFQs
      total_rfqs: `
        SELECT COUNT(*) AS total
        FROM rfqopportunity
      `,

      // Total Tenders
      total_tenders: `
        SELECT COUNT(*) AS total
        FROM tenderopportunity
      `,

      // Suppliers with both business profile and maturity
      total_registered_suppliers: `
        SELECT COUNT(DISTINCT bp.business_id) AS total
        FROM business_profile bp
        INNER JOIN business_maturity bm
          ON bm.business_id = bp.business_id
        INNER JOIN \`user\` u
          ON u.user_id = bp.user_id
        WHERE u.role_id = 1
      `,

      // Total Business Advisory Requests
      total_business_advisory: `
        SELECT COUNT(*) AS total
        FROM advisory_request
      `,

      // Total ESD Activities
      total_esd_activities: `
        SELECT COUNT(*) AS total
        FROM esd_activity
      `
    };

    const entries = Object.entries(queries);

    const results = await Promise.all(
      entries.map(async ([key, sql]) => {
        const [rows] = await connection.query(sql);

        return [
          key,
          Number(rows[0]?.total || 0)
        ];
      })
    );

    return Object.fromEntries(results);

  } catch (error) {
    console.error(
      "Error fetching dashboard statistics:",
      error
    );
    throw error;

  } finally {
    connection.release();
  }
};

module.exports = {
  getDashboardStatistics
};
