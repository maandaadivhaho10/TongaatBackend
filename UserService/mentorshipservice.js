const db = require("../config/database");

// Insert mentorship request
const createMentorshipRequest = async (data) => {
    const {
        user_id,
        business_goal,
        description,
        preferred_area,
        request_date
    } = data;

    const query = `
        INSERT INTO business_mentorship_request
        (
            user_id,
            business_goal,
            description,
            preferred_area,
            request_date
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        user_id,
        business_goal,
        description,
        preferred_area || null,
        request_date
    ]);

    return result.insertId;
};


// Get all mentorship requests
const getAllMentorshipRequests = async () => {
    const query = `
        SELECT
            mentorship_request_id,
            user_id,
            business_goal,
            description,
            preferred_area,
            request_date,
            status,
            mentor_id,
            created_at
        FROM business_mentorship_request
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query);

    return rows;
};


// Get mentorship request by ID
const getMentorshipRequestById = async (id) => {
    const query = `
        SELECT
            mentorship_request_id,
            user_id,
            business_goal,
            description,
            preferred_area,
            request_date,
            status,
            mentor_id,
            created_at
        FROM business_mentorship_request
        WHERE mentorship_request_id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    return rows[0];
};


module.exports = {
    createMentorshipRequest,
    getAllMentorshipRequests,
    getMentorshipRequestById
};