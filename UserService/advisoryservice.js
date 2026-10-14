const db = require("../config/database");

const createAdvisoryRequest = async (data) => {
    const {
        user_id,
        subject,
        description,
        request_date,
        preferred_date
    } = data;

    console.log("5. Starting SQL INSERT");

    const query = `
        INSERT INTO business_advisory_request
        (
            user_id,
            subject,
            description,
            request_date,
            preferred_date
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        user_id,
        subject,
        description,
        request_date,
        preferred_date ?? null
    ]);

    console.log("6. SQL INSERT completed");

    return result.insertId;
};

// Get all advisory requests
const getAllAdvisoryRequests = async () => {
    const query = `
        SELECT
            advisory_request_id,
            user_id,
            subject,
            description,
            request_date,
            preferred_date,
            status,
            assigned_to,
            created_at
        FROM business_advisory_request
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query);

    return rows;
};


// Get advisory request by ID
const getAdvisoryRequestById = async (id) => {
    const query = `
        SELECT
            advisory_request_id,
            user_id,
            subject,
            description,
            request_date,
            preferred_date,
            status,
            assigned_to,
            created_at
        FROM business_advisory_request
        WHERE advisory_request_id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    return rows[0];
};


// Get advisory requests by user ID
const getAdvisoryRequestsByUserId = async (user_id) => {
    const query = `
        SELECT
            advisory_request_id,
            user_id,
            subject,
            description,
            request_date,
            preferred_date,
            status,
            assigned_to,
            created_at
        FROM business_advisory_request
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [user_id]);

    return rows;
};


module.exports = {
    createAdvisoryRequest,
    getAllAdvisoryRequests,
    getAdvisoryRequestById,
    getAdvisoryRequestsByUserId
};