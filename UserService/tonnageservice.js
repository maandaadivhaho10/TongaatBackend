const db = require("../config/database");

const createTonnageSubmission = async ({
    user_id,
    submission_date,
    tonnage
}) => {

    const [result] = await db.query(
        `
        INSERT INTO tonnage_submission
        (
            user_id,
            submission_date,
            tonnage
        )
        VALUES (?, ?, ?)
        `,
        [
            user_id,
            submission_date,
            tonnage
        ]
    );

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
// Get all tonnage submissions for a user
const getAllTonnageByUserId = async (user_id) => {

    const query = `
        SELECT
            tonnage_id,
            user_id,
            submission_date,
            tonnage,
            status,
            created_at
        FROM tonnage_submission
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(
        query,
        [user_id]
    );

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
    getTonnageByUserId,
    getAllTonnageByUserId
};