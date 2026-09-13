const db = require("../config/database");

const respondToMeeting = async (meetingId, userId, responseStatus) => {

    // Check if participant record already exists
    const checkSql = `
        SELECT participant_id
        FROM meeting_participant
        WHERE meeting_id = ?
        AND user_id = ?
    `;

    const [existing] = await db.execute(checkSql, [
        meetingId,
        userId
    ]);

    if (existing.length > 0) {

        // Update existing response
        const updateSql = `
            UPDATE meeting_participant
            SET
                response_status = ?,
                response_date = NOW()
            WHERE meeting_id = ?
            AND user_id = ?
        `;

        await db.execute(updateSql, [
            responseStatus,
            meetingId,
            userId
        ]);

        return {
            action: "UPDATED"
        };
    }

    // Create participant response if it doesn't exist
    const insertSql = `
        INSERT INTO meeting_participant (
            meeting_id,
            user_id,
            response_status,
            response_date
        )
        VALUES (?, ?, ?, NOW())
    `;

    await db.execute(insertSql, [
        meetingId,
        userId,
        responseStatus
    ]);

    return {
        action: "CREATED"
    };
};

module.exports = {
    respondToMeeting
};