
const db = require("../../config/database");

// ============================================
// CREATE ACTIVITY
// ============================================

const createActivity = async ({
  name,
  description,
  activity_date,
  created_by,
}) => {
  const [result] = await db.execute(
    `INSERT INTO esd_activities
      (name, description, activity_date, created_by)
     VALUES (?, ?, ?, ?)`,
    [name, description, activity_date, created_by]
  );

  return getActivityById(result.insertId);
};

// ============================================
// GET ALL ACTIVITIES
// ============================================

const getAllActivities = async () => {
  const [rows] = await db.execute(
    `SELECT
        a.activity_id,
        a.name,
        a.description,
        DATE_FORMAT(a.activity_date, '%Y-%m-%d')
          AS activity_date,
        a.status,
        a.created_by,
        a.created_at,
        a.updated_at,
        u.first_name,
        u.last_name
     FROM esd_activities a
     INNER JOIN user u
       ON a.created_by = u.user_id
     ORDER BY a.activity_date DESC, a.activity_id DESC`
  );

  return rows;
};

// ============================================
// GET ACTIVITY BY ID
// ============================================

const getActivityById = async (id) => {
  const [rows] = await db.execute(
    `SELECT
        a.activity_id,
        a.name,
        a.description,
        DATE_FORMAT(a.activity_date, '%Y-%m-%d')
          AS activity_date,
        a.status,
        a.created_by,
        a.created_at,
        a.updated_at,
        u.first_name,
        u.last_name
     FROM esd_activities a
     INNER JOIN user u
       ON a.created_by = u.user_id
     WHERE a.activity_id = ?`,
    [id]
  );

  return rows[0] || null;
};

// ============================================
// UPDATE ACTIVITY
// ============================================

const updateActivity = async (
  id,
  { name, description, activity_date, status }
) => {
  const [result] = await db.execute(
    `UPDATE esd_activities
     SET name = ?,
         description = ?,
         activity_date = ?,
         status = ?
     WHERE activity_id = ?`,
    [name, description, activity_date, status, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getActivityById(id);
};

// ============================================
// DELETE ACTIVITY
// ============================================

const deleteActivity = async (id) => {
  const [result] = await db.execute(
    `DELETE FROM esd_activities
     WHERE activity_id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
};
