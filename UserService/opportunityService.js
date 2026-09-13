const db = require("../config/database");
const { containerClient } = require("../config/azureStorage");
const { randomUUID } = require("crypto");


// ==========================================
// CREATE OPPORTUNITY
// ==========================================

const createOpportunity = async (opportunityData, imageFile) => {

    const {
        title,
        description,
        opportunity_type,
        closing_date,
        location,
        target_role_id,
        published_by
    } = opportunityData;

    let imageUrl = null;

    // Upload image to Azure Blob Storage
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

    // Insert opportunity into MySQL
    const sql = `
        INSERT INTO opportunity
        (
            title,
            description,
            opportunity_type,
            closing_date,
            location,
            target_role_id,
            published_by,
            image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        title,
        description,
        opportunity_type,
        closing_date,
        location,
        target_role_id,
        published_by,
        imageUrl
    ]);

    return {
        opportunity_id: result.insertId,
        title,
        description,
        opportunity_type,
        closing_date,
        location,
        target_role_id,
        published_by,
        image_url: imageUrl,
        status: "OPEN"
    };
};


// ==========================================
// GET OPPORTUNITIES BY TARGET ROLE
// ==========================================

const getOpportunitiesByTargetId = async (targetId) => {

    const sql = `
        SELECT
            opportunity_id,
            title,
            description,
            opportunity_type,
            closing_date,
            location,
            target_role_id,
            published_by,
            image_url,
            status,
            created_at
        FROM opportunity
        WHERE target_role_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(sql, [targetId]);

    return rows;
};


module.exports = {
    createOpportunity,
    getOpportunitiesByTargetId
};