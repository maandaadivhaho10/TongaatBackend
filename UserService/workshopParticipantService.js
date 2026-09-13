const db = require("../config/database");

// Respond to a workshop
const respondToWorkshop = async (workshopId, userId, responseStatus) => {

    // Check if workshop exists
    const [workshop] = await db.execute(
        `SELECT workshop_id 
         FROM workshop 
         WHERE workshop_id = ?`,
        [workshopId]
    );

    if (workshop.length === 0) {
        throw new Error("Workshop not found");
    }

    // Check if participant already exists
    const [participant] = await db.execute(
        `SELECT participant_id 
         FROM workshop_participant
         WHERE workshop_id = ? AND user_id = ?`,
        [workshopId, userId]
    );

    if (participant.length > 0) {

        // Update existing response
        await db.execute(
            `UPDATE workshop_participant
             SET response_status = ?,
                 response_date = NOW()
             WHERE workshop_id = ?
             AND user_id = ?`,
            [responseStatus, workshopId, userId]
        );

        return {
            participant_id: participant[0].participant_id,
            workshop_id: workshopId,
            user_id: userId,
            response_status: responseStatus
        };

    } else {

        // Create participant
        const [result] = await db.execute(
            `INSERT INTO workshop_participant
             (
                 workshop_id,
                 user_id,
                 response_status,
                 response_date
             )
             VALUES (?, ?, ?, NOW())`,
            [
                workshopId,
                userId,
                responseStatus
            ]
        );

        return {
            participant_id: result.insertId,
            workshop_id: workshopId,
            user_id: userId,
            response_status: responseStatus
        };
    }
};

module.exports = {
    respondToWorkshop
};