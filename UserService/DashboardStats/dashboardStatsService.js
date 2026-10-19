const db = require("../../config/database");

const getDashboardStatistics = async () => {
  const connection = await db.getConnection();

  try {
    const queries = {
      // =====================================================
      // TOTAL RFQs
      // =====================================================
      total_rfqs: `
        SELECT COUNT(*) AS total
        FROM rfqopportunity
      `,

      // =====================================================
      // TOTAL TENDERS
      // =====================================================
      total_tenders: `
        SELECT COUNT(*) AS total
        FROM tenderopportunity
      `,

      // =====================================================
      // TOTAL REGISTERED SUPPLIERS
      // =====================================================
      total_registered_suppliers: `
        SELECT COUNT(DISTINCT bp.business_id) AS total
        FROM business_profile bp
        INNER JOIN business_maturity bm
          ON bm.business_id = bp.business_id
        INNER JOIN \`user\` u
          ON u.user_id = bp.user_id
        WHERE u.role_id = 1
      `,

      // =====================================================
      // MALE SUPPLIERS
      // =====================================================
      total_male_suppliers: `
        SELECT COUNT(DISTINCT u.user_id) AS total
        FROM \`user\` u
        INNER JOIN business_profile bp
          ON bp.user_id = u.user_id
        INNER JOIN business_maturity bm
          ON bm.business_id = bp.business_id
        WHERE u.role_id = 1
          AND LOWER(TRIM(u.gender)) IN ('male', 'm')
      `,

      // =====================================================
      // FEMALE SUPPLIERS
      // =====================================================
      total_female_suppliers: `
        SELECT COUNT(DISTINCT u.user_id) AS total
        FROM \`user\` u
        INNER JOIN business_profile bp
          ON bp.user_id = u.user_id
        INNER JOIN business_maturity bm
          ON bm.business_id = bp.business_id
        WHERE u.role_id = 1
          AND LOWER(TRIM(u.gender)) IN ('female', 'f')
      `,

      // =====================================================
      // OTHER / UNSPECIFIED GENDER
      // =====================================================
      total_other_suppliers: `
        SELECT COUNT(DISTINCT u.user_id) AS total
        FROM \`user\` u
        INNER JOIN business_profile bp
          ON bp.user_id = u.user_id
        INNER JOIN business_maturity bm
          ON bm.business_id = bp.business_id
        WHERE u.role_id = 1
          AND (
            u.gender IS NULL
            OR LOWER(TRIM(u.gender)) NOT IN (
              'male', 'm', 'female', 'f'
            )
          )
      `,

      // =====================================================
      // TOTAL BUSINESS ADVISORY REQUESTS
      // =====================================================
      total_business_advisory: `
        SELECT COUNT(*) AS total
        FROM business_advisory_request
      `,

      // =====================================================
      // TOTAL ESD ACTIVITIES
      // =====================================================
      total_esd_activities: `
        SELECT COUNT(*) AS total
        FROM esd_activities
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