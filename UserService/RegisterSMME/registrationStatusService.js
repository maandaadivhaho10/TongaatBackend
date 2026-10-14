
const db = require("../../config/database");


const getRegistrationStatus = async (userId) => {
  const [profiles] = await db.query(
    `SELECT business_id, business_name
     FROM business_profile
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  const profile = profiles[0];

  if (!profile) {
    return {
      business_id: null,
      business_name: null,
      profile_registered: false,
      maturity_registered: false,
      registration_completed: false
    };
  }

  const [maturities] = await db.query(
    `SELECT maturity_id
     FROM business_maturity
     WHERE business_id = ?
     LIMIT 1`,
    [profile.business_id]
  );

  const maturityRegistered = maturities.length > 0;

  return {
    business_id: profile.business_id,
    business_name: profile.business_name,
    profile_registered: true,
    maturity_registered: maturityRegistered,
    registration_completed: maturityRegistered
  };
};

module.exports = { getRegistrationStatus };