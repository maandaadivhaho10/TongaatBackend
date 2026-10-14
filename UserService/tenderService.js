const db = require("../config/database");

// =====================================================
// CREATE TENDER
// =====================================================

async function createTender({
    title,
    description,
    closing_date,
    location,
    published_by,
    image_url
}) {

    const query = `
        INSERT INTO TenderOpportunity
        (
            title,
            description,
            closing_date,
            location,
            published_by,
            image_url
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        title,
        description,
        closing_date || null,
        location || null,
        published_by,
        image_url || null
    ]);

    return result.insertId;
}


// =====================================================
// GET ALL TENDERS
// =====================================================

async function getAllTenders() {

    const query = `
        SELECT
            tender_id,
            title,
            description,
            closing_date,
            location,
            published_by,
            status,
            image_url,
            created_at
        FROM TenderOpportunity
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query);

    return rows;
}


// =====================================================
// GET TENDER BY ID
// =====================================================

async function getTenderById(tenderId) {

    const query = `
        SELECT
            tender_id,
            title,
            description,
            closing_date,
            location,
            published_by,
            status,
            image_url,
            created_at
        FROM TenderOpportunity
        WHERE tender_id = ?
    `;

    const [rows] = await db.execute(
        query,
        [tenderId]
    );

    return rows[0] || null;
}


module.exports = {
    createTender,
    getAllTenders,
    getTenderById
};