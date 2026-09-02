const db = require("../config/database");


// Add tonnage
const createTonnageSubmission = async (data) => {
    const {
        user_id,
        submission_date,
        tonnage,
        crop_type,
        farm_location,
        notes
    } = data;

    const query = `
        INSERT INTO tonnage_submission
        (
            user_id,
            submission_date,
            tonnage,
            crop_type,
            farm_location,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        user_id,
        submission_date,
        tonnage,
        crop_type || null,
        farm_location || null,
        notes || null
    ]);

    return result.insertId;
};


// Get all tonnage
const getAllTonnageSubmissions = async () => {
    const query = `
        SELECT
            tonnage_id,
            user_id,
            submission_date,
            tonnage,
            crop_type,
            farm_location,
            notes,
            status,
            created_at
        FROM tonnage_submission
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query);

    return rows;
};


// Get tonnage by user ID
const getTonnageByUserId = async (user_id) => {
    const query = `
        SELECT
            tonnage_id,
            user_id,
            submission_date,
            tonnage,
            crop_type,
            farm_location,
            notes,
            status,
            created_at
        FROM tonnage_submission
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [user_id]);

    return rows;
};


module.exports = {
    createTonnageSubmission,
    getAllTonnageSubmissions,
    getTonnageByUserId
};