const db = require("../config/database");

const {
    createRFQ,
    addRFQSectors,
    getRFQsForUser,
    getAppliedRfqsByUser
} = require("../UserService/rfqService");


// =====================================================
// CREATE RFQ
// =====================================================

async function createRFQOpportunity(req, res) {

    const connection = await db.getConnection();

    try {

        const {
            title,
            description,
            closing_date,
            location,
            published_by,
            target_role_id,
            sector_ids
        } = JSON.parse(req.body.rfqData);


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        if (!description) {
            return res.status(400).json({
                success: false,
                message: "Description is required"
            });
        }

        if (!published_by) {
            return res.status(400).json({
                success: false,
                message: "published_by is required"
            });
        }

        if (!target_role_id) {
            return res.status(400).json({
                success: false,
                message: "target_role_id is required"
            });
        }

        if (!Array.isArray(sector_ids) || sector_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one sector is required"
            });
        }


        // -------------------------------------------------
        // CHECK THAT TARGET ROLE IS SMME
        // -------------------------------------------------

        const [roles] = await connection.execute(
            `
            SELECT role_id
            FROM role
            WHERE role_id = ?
            AND role_name = 'SMME'
            `,
            [target_role_id]
        );

        if (roles.length === 0) {

            return res.status(400).json({
                success: false,
                message: "RFQ target role must be SMME"
            });
        }


        // -------------------------------------------------
        // CHECK SECTORS EXIST
        // -------------------------------------------------

        const placeholders = sector_ids
            .map(() => "?")
            .join(",");

        const [sectors] = await connection.execute(
            `
            SELECT sector_id
            FROM sector
            WHERE sector_id IN (${placeholders})
            `,
            sector_ids
        );

        if (sectors.length !== sector_ids.length) {

            return res.status(400).json({
                success: false,
                message: "One or more sector IDs are invalid"
            });
        }


        // -------------------------------------------------
        // START TRANSACTION
        // -------------------------------------------------

        await connection.beginTransaction();


        // -------------------------------------------------
        // CREATE RFQ
        // -------------------------------------------------

        const rfq = await createRFQ(
            connection,
            {
                title,
                description,
                closing_date,
                location,
                published_by,
                target_role_id
            },
            req.file
        );


        // -------------------------------------------------
        // ADD SECTORS
        // -------------------------------------------------

        await addRFQSectors(
            connection,
            rfq.rfq_id,
            sector_ids
        );


        // -------------------------------------------------
        // COMMIT
        // -------------------------------------------------

        await connection.commit();


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return res.status(201).json({
            success: true,
            message: "RFQ opportunity created successfully",
            data: {
                rfq_id: rfq.rfq_id,
                title: rfq.title,
                description: rfq.description,
                closing_date: rfq.closing_date,
                location: rfq.location,
                published_by: rfq.published_by,
                target_role_id: rfq.target_role_id,
                sector_ids,
                status: rfq.status,
                image_url: rfq.image_url
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error("Create RFQ error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create RFQ opportunity",
            error: error.message
        });

    } finally {

        connection.release();
    }
}


// =====================================================
// GET RFQs FOR USER'S SECTOR
// =====================================================

async function getUserRFQs(req, res) {

    const connection = await db.getConnection();

    try {

        const { userId } = req.params;


        // -------------------------------------------------
        // VALIDATE USER ID
        // -------------------------------------------------

        if (!userId) {

            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }


        // -------------------------------------------------
        // CHECK USER EXISTS
        // -------------------------------------------------

        const [users] = await connection.execute(
            `
            SELECT user_id
            FROM user
            WHERE user_id = ?
            `,
            [userId]
        );

        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // -------------------------------------------------
        // GET RFQs
        // -------------------------------------------------

        const rfqs = await getRFQsForUser(
            connection,
            userId
        );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            count: rfqs.length,
            data: rfqs
        });

    } catch (error) {

        console.error(
            "Get user RFQs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve RFQ opportunities",
            error: error.message
        });

    } finally {

        connection.release();
    }
}


// =====================================================
// GET RFQs APPLIED FOR BY USER
// =====================================================

async function getMyAppliedRFQs(req, res) {

    const connection = await db.getConnection();

    try {

        const { userId } = req.params;


        // -------------------------------------------------
        // VALIDATE USER ID
        // -------------------------------------------------

        if (!userId) {

            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }


        // -------------------------------------------------
        // CHECK USER EXISTS
        // -------------------------------------------------

        const [users] = await connection.execute(
            `
            SELECT user_id
            FROM user
            WHERE user_id = ?
            `,
            [userId]
        );

        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // -------------------------------------------------
        // GET APPLIED RFQs
        // -------------------------------------------------

        const rfqs = await getAppliedRfqsByUser(
            connection,
            userId
        );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            count: rfqs.length,
            data: rfqs
        });

    } catch (error) {

        console.error(
            "Get applied RFQs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve applied RFQs",
            error: error.message
        });

    } finally {

        connection.release();
    }
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createRFQOpportunity,
    getUserRFQs,
    getMyAppliedRFQs
};