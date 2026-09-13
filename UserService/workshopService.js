const db = require("../config/database");

// Create a new workshop
const createWorkshop = async (workshopData) => {
    const {
        title,
        description,
        workshop_date,
        workshop_time,
        location,
        target_role_id,
        created_by
    } = workshopData;

    const sql = `
        INSERT INTO workshop
        (
            title,
            description,
            workshop_date,
            workshop_time,
            location,
            target_role_id,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        title,
        description,
        workshop_date,
        workshop_time,
        location,
        target_role_id,
        created_by
    ]);

    return {
        workshop_id: result.insertId,
        title,
        description,
        workshop_date,
        workshop_time,
        location,
        target_role_id,
        created_by,
        status: "SCHEDULED"
    };
};

module.exports = {
    createWorkshop
};