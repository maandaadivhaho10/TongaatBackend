const db = require("../config/database");

const getResponsesByOpportunityName = async (name) => {
    const connection = await db.getConnection();

    try {
        const [rows] = await connection.execute(
            `
            SELECT
                o.opportunity_id,
                o.title AS opportunity_name,

                r.response_id,
                r.response_date,
                r.proposal,
                r.document_path,
                r.status AS response_status,

                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number

            FROM opportunity o

            INNER JOIN opportunity_response r
                ON o.opportunity_id = r.opportunity_id

            INNER JOIN user u
                ON r.user_id = u.user_id

            WHERE o.title = ?

            ORDER BY r.response_date DESC
            `,
            [name]
        );

        return rows;

    } finally {
        connection.release();
    }
};

module.exports = {
    getResponsesByOpportunityName
};