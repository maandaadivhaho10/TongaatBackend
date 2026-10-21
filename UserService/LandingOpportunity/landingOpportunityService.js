
const db = require("../../config/database");

const getLatestOpportunities = async () => {

    // Latest 3 tenders
    const [tenders] = await db.query(`
        SELECT
            title,
            description,
            closing_date,
            location
        FROM TenderOpportunity
        WHERE closing_date IS NULL
           OR closing_date >= CURDATE()
        ORDER BY created_at DESC
        LIMIT 3
    `);

    // Latest 3 RFQs
    const [rfqs] = await db.query(`
        SELECT
            title,
            description,
            closing_date,
            location
        FROM rfqopportunity
        WHERE closing_date IS NULL
           OR closing_date >= CURDATE()
        ORDER BY created_at DESC
        LIMIT 3
    `);

    return {
        tenders,
        rfqs
    };
};

module.exports = {
    getLatestOpportunities
};
