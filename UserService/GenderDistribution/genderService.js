
const db = require("../../config/database");

const getGenderDistribution = async () => {
  const query = `
    SELECT
      COUNT(*) AS total_users,

      SUM(
        CASE
          WHEN LOWER(TRIM(gender)) IN ('male', 'm')
          THEN 1 ELSE 0
        END
      ) AS male,

      SUM(
        CASE
          WHEN LOWER(TRIM(gender)) IN ('female', 'f')
          THEN 1 ELSE 0
        END
      ) AS female,

      SUM(
        CASE
          WHEN gender IS NOT NULL
            AND TRIM(gender) <> ''
            AND LOWER(TRIM(gender))
                NOT IN ('male', 'm', 'female', 'f')
          THEN 1 ELSE 0
        END
      ) AS other,

      SUM(
        CASE
          WHEN gender IS NULL OR TRIM(gender) = ''
          THEN 1 ELSE 0
        END
      ) AS not_specified

    FROM \`user\`
  `;

  const [rows] = await db.query(query);

  const result = rows[0];

  return {
    total_users: Number(result.total_users || 0),
    male: Number(result.male || 0),
    female: Number(result.female || 0),
    other: Number(result.other || 0),
    not_specified: Number(result.not_specified || 0),
  };
};

module.exports = {
  getGenderDistribution,
};
