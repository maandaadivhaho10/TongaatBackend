const db = require("../config/database");

// =====================================================
// CREATE TENDER RESPONSE
// =====================================================

async function createTenderResponse({
    tender_id,
    user_id
}) {

    const query = `
        INSERT INTO Tender_response
        (
            tender_id,
            user_id
        )
        VALUES (?, ?)
    `;

    const [result] = await db.execute(query, [
        tender_id,
        user_id
    ]);

    return result.insertId;
}


// =====================================================
// GET ALL RESPONSES FOR A TENDER
// =====================================================

async function getResponsesByTender(tender_id) {

    const query = `
        SELECT
            tender_response_id,
            tender_id,
            user_id,
            response_date,
            status,
            email_sent,
            email_sent_at,
            created_at
        FROM Tender_response
        WHERE tender_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [tender_id]);

    return rows;
}


// =====================================================
// GET TENDER RESPONSE BY ID
// =====================================================

async function getTenderResponseById(tender_response_id) {

    const query = `
        SELECT
            tender_response_id,
            tender_id,
            user_id,
            response_date,
            status,
            email_sent,
            email_sent_at,
            created_at
        FROM Tender_response
        WHERE tender_response_id = ?
    `;

    const [rows] = await db.execute(query, [
        tender_response_id
    ]);

    return rows[0];
}


module.exports = {
    createTenderResponse,
    getResponsesByTender,
    getTenderResponseById
};