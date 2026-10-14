const db = require("../config/database");

const {
    createRFQ,
    addRFQSectors,
    getRFQsForUser,
    getAppliedRfqsByUser,getAllRFQsService
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


        if (!Array.isArray(sector_ids) || sector_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one sector is required"
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
                published_by
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
// GET RFQs FOR LOGGED-IN USER'S SECTOR
// =====================================================

async function getUserRFQs(req, res) {

    let connection;

    try {

        // -------------------------------------------------
        // GET USER ID FROM JWT TOKEN
        // -------------------------------------------------

        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found in token"
            });
        }

        connection = await db.getConnection();

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
        // GET RFQs BASED ON USER'S SECTOR
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
            message: "Failed to retrieve RFQ opportunities"
        });

    } finally {

        if (connection) {
            connection.release();
        }
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
// FETCH ALL RFQS CONTROLLER
// =====================================================

const getAllRFQs = async (req, res) => {
    try {
        const rfqs = await getAllRFQsService();

        return res.status(200).json({
            success: true,
            message: "RFQs retrieved successfully",
            total: rfqs.length,
            data: rfqs
        });

    } catch (error) {
        console.error("Get RFQs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve RFQs"
        });
    }
};




// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createRFQOpportunity,
    getUserRFQs,
    getMyAppliedRFQs,getAllRFQs
};