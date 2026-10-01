const db = require("../config/database");
const { containerClient } = require("../config/azureStorage");
const { randomUUID } = require("crypto");


// =====================================================
// CREATE RFQ OPPORTUNITY
// =====================================================

async function createRFQ(connection, rfqData, imageFile) {

    const {
        title,
        description,
        closing_date,
        location,
        published_by,
        target_role_id
    } = rfqData;


    let imageUrl = null;


    // -------------------------------------------------
    // Upload Image to Azure Blob Storage
    // -------------------------------------------------

    if (imageFile) {

        const fileExtension =
            imageFile.originalname.split(".").pop();

        const blobName =
            `${randomUUID()}.${fileExtension}`;

        const blockBlobClient =
            containerClient.getBlockBlobClient(blobName);


        await blockBlobClient.uploadData(
            imageFile.buffer,
            {
                blobHTTPHeaders: {
                    blobContentType: imageFile.mimetype
                }
            }
        );


        imageUrl = blockBlobClient.url;
    }


    // -------------------------------------------------
    // Create RFQ
    // -------------------------------------------------

    const [result] = await connection.execute(
        `
        INSERT INTO RFQopportunity
        (
            title,
            description,
            closing_date,
            location,
            published_by,
            target_role_id,
            status,
            image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
        `,
        [
            title,
            description,
            closing_date || null,
            location || null,
            published_by,
            target_role_id,
            imageUrl
        ]
    );


    return {
        rfq_id: result.insertId,
        title,
        description,
        closing_date,
        location,
        published_by,
        target_role_id,
        status: "OPEN",
        image_url: imageUrl
    };
}


// =====================================================
// ADD SECTORS TO RFQ
// =====================================================

async function addRFQSectors(connection, rfqId, sectorIds) {

    for (const sectorId of sectorIds) {

        await connection.execute(
            `
            INSERT INTO rfq_sector
            (
                rfq_id,
                sector_id
            )
            VALUES (?, ?)
            `,
            [
                rfqId,
                sectorId
            ]
        );
    }
}


// =====================================================
// GET RFQs FOR USER
// =====================================================

async function getRFQsForUser(connection, userId) {

    const [rows] = await connection.execute(
        `
        SELECT DISTINCT
            r.rfq_id,
            r.title,
            r.description,
            r.closing_date,
            r.location,
            r.status,
            r.image_url,
            r.created_at,
            s.sector_id,
            s.sector_name

        FROM RFQopportunity r

        INNER JOIN rfq_sector rs
            ON r.rfq_id = rs.rfq_id

        INNER JOIN sector s
            ON rs.sector_id = s.sector_id

        INNER JOIN business_maturity bm
            ON bm.sector_id = rs.sector_id

        INNER JOIN business_profile bp
            ON bp.business_id = bm.business_id

        INNER JOIN user u
            ON u.user_id = bp.user_id

        WHERE u.user_id = ?
          AND r.target_role_id = 2
          AND r.status = 'OPEN'

        ORDER BY r.created_at DESC
        `,
        [userId]
    );


    return rows;
}


// =====================================================
// GET RFQs APPLIED FOR BY USER
// =====================================================
// =====================================================
// GET RFQs APPLIED FOR BY USER
// =====================================================

async function getAppliedRfqsByUser(connection, userId) {

    const [rows] = await connection.execute(
        `
        SELECT
            r.rfq_id,
            r.title,
            r.description,
            r.closing_date,
            r.location,

            rr.proposal,
            rr.quoted_price,
            rr.response_date,
            rr.status AS application_status

        FROM RFQ_response rr

        INNER JOIN RFQopportunity r
            ON rr.rfq_id = r.rfq_id

        WHERE rr.user_id = ?

        ORDER BY rr.response_date DESC
        `,
        [userId]
    );

    return rows;
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createRFQ,
    addRFQSectors,
    getRFQsForUser,
    getAppliedRfqsByUser
};