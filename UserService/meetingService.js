const db = require("../config/database");

// Create meeting
const createMeeting = async (meetingData) => {
    const {
        title,
        description,
        meeting_date,
        meeting_time,
        location,
        target_role_id,
        created_by
    } = meetingData;

    const sql = `
        INSERT INTO meeting
        (
            title,
            description,
            meeting_date,
            meeting_time,
            location,
            target_role_id,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        title,
        description,
        meeting_date,
        meeting_time,
        location,
        target_role_id,
        created_by
    ]);

    return {
        meeting_id: result.insertId,
        title,
        description,
        meeting_date,
        meeting_time,
        location,
        target_role_id,
        created_by,
        status: "SCHEDULED"
    };
};

// Get all meetings
const getAllMeetings = async () => {
    const sql = `
        SELECT 
            m.meeting_id,
            m.title,
            m.description,
            m.meeting_date,
            m.meeting_time,
            m.location,
            m.target_role_id,
            r.role_name AS target_role,
            m.created_by,
            m.status,
            m.created_at
        FROM meeting m
        LEFT JOIN role r 
            ON m.target_role_id = r.role_id
        ORDER BY m.meeting_date ASC, m.meeting_time ASC
    `;

    const [rows] = await db.execute(sql);

    return rows;
};

// Get meeting by ID
const getMeetingById = async (meetingId) => {
    const sql = `
        SELECT 
            m.meeting_id,
            m.title,
            m.description,
            m.meeting_date,
            m.meeting_time,
            m.location,
            m.target_role_id,
            r.role_name AS target_role,
            m.created_by,
            m.status,
            m.created_at
        FROM meeting m
        LEFT JOIN role r 
            ON m.target_role_id = r.role_id
        WHERE m.meeting_id = ?
    `;

    const [rows] = await db.execute(sql, [meetingId]);

    return rows[0];
};

// Update meeting
const updateMeeting = async (meetingId, meetingData) => {
    const {
        title,
        description,
        meeting_date,
        meeting_time,
        location,
        target_role_id,
        status
    } = meetingData;

    const sql = `
        UPDATE meeting
        SET
            title = ?,
            description = ?,
            meeting_date = ?,
            meeting_time = ?,
            location = ?,
            target_role_id = ?,
            status = ?
        WHERE meeting_id = ?
    `;

    const [result] = await db.execute(sql, [
        title,
        description,
        meeting_date,
        meeting_time,
        location,
        target_role_id,
        status,
        meetingId
    ]);

    return result;
};

// Delete meeting
const deleteMeeting = async (meetingId) => {
    const sql = `
        DELETE FROM meeting
        WHERE meeting_id = ?
    `;

    const [result] = await db.execute(sql, [meetingId]);

    return result;
};

module.exports = {
    createMeeting,
    getAllMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting
};