const db = require("../config/database");


// =====================================================
// CREATE RFQ RESPONSE
// =====================================================

async function createRFQResponse(connection, responseData) {

    const {
        rfq_id,
        user_id,
        proposal,
        quoted_price
    } = responseData;


    const [result] = await connection.execute(
        `
        INSERT INTO RFQ_response
        (
            rfq_id,
            user_id,
            proposal,
            quoted_price,
            quotation_document_path,
            status,
            email_sent
        )
        VALUES (?, ?, ?, ?, NULL, 'SUBMITTED', FALSE)
        `,
        [
            rfq_id,
            user_id,
            proposal,
            quoted_price
        ]
    );


    return result.insertId;
}


// =====================================================
// MARK EMAIL AS SENT
// =====================================================

async function markEmailAsSent(connection, responseId) {

    await connection.execute(
        `
        UPDATE RFQ_response
        SET
            email_sent = TRUE,
            email_sent_at = NOW()
        WHERE rfq_response_id = ?
        `,
        [responseId]
    );
}


module.exports = {
    createRFQResponse,
    markEmailAsSent
};