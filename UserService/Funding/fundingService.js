
const db = require("../../config/database");

// =====================================================
// CREATE FUNDING OPPORTUNITY
// =====================================================

const createFundingService = async (data) => {
    const {
        title,
        institution_funder,
        description,
        published_by
    } = data;

    const [result] = await db.execute(
        `INSERT INTO fundingopportunity
        (title, institution_funder, description, published_by)
        VALUES (?, ?, ?, ?)`,
        [title, institution_funder, description, published_by]
    );

    return {
        funding_id: result.insertId,
        title,
        institution_funder,
        description,
        status: "OPEN",
        published_by
    };
};

// =====================================================
// GET ALL FUNDING OPPORTUNITIES
// =====================================================

const getAllFundingService = async () => {
    const [rows] = await db.execute(
        `SELECT
            f.*,
            u.first_name AS publisher_first_name,
            u.last_name AS publisher_last_name
         FROM fundingopportunity f
         INNER JOIN user u
            ON f.published_by = u.user_id
         ORDER BY f.created_at DESC, f.funding_id DESC`
    );

    return rows;
};

// =====================================================
// GET SINGLE FUNDING OPPORTUNITY
// =====================================================

const getFundingByIdService = async (funding_id) => {
    const [rows] = await db.execute(
        `SELECT
            f.*,
            u.first_name AS publisher_first_name,
            u.last_name AS publisher_last_name
         FROM fundingopportunity f
         INNER JOIN user u
            ON f.published_by = u.user_id
         WHERE f.funding_id = ?`,
        [funding_id]
    );

    return rows[0] || null;
};

// =====================================================
// UPDATE FUNDING STATUS
// =====================================================

const updateFundingStatusService = async (
    funding_id,
    status
) => {
    const [result] = await db.execute(
        `UPDATE fundingopportunity
         SET status = ?
         WHERE funding_id = ?`,
        [status, funding_id]
    );

    return result.affectedRows > 0;
};

// =====================================================
// APPLY FOR FUNDING
// =====================================================

const applyForFundingService = async (
    funding_id,
    user_id
) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [opportunities] = await connection.execute(
            `SELECT status
             FROM fundingopportunity
             WHERE funding_id = ?
             FOR UPDATE`,
            [funding_id]
        );

        if (opportunities.length === 0) {
            const error = new Error(
                "Funding opportunity not found"
            );
            error.statusCode = 404;
            throw error;
        }

        if (opportunities[0].status !== "OPEN") {
            const error = new Error(
                "This funding opportunity is not open"
            );
            error.statusCode = 400;
            throw error;
        }

        const [businesses] = await connection.execute(
            `SELECT business_id
             FROM business_profile
             WHERE user_id = ?`,
            [user_id]
        );

        if (businesses.length === 0) {
            const error = new Error(
                "Please register your business before applying"
            );
            error.statusCode = 403;
            throw error;
        }

        const [result] = await connection.execute(
            `INSERT INTO fundingresponse
                (funding_id, user_id)
             VALUES (?, ?)`,
            [funding_id, user_id]
        );

        await connection.commit();

        return {
            funding_response_id: result.insertId,
            funding_id,
            user_id,
            status: "SUBMITTED"
        };

    } catch (error) {
        await connection.rollback();

        if (error.code === "ER_DUP_ENTRY") {
            error.statusCode = 409;
            error.message =
                "You have already applied for this funding opportunity";
        }

        throw error;

    } finally {
        connection.release();
    }
};

// =====================================================
// GET FUNDING RESPONSES
// =====================================================

const getFundingResponsesService = async (funding_id) => {
    const [rows] = await db.execute(
        `SELECT
            fr.*,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            bp.business_id,
            bp.business_name,
            bp.company_registration_number,
            bp.bee_level,
            bp.tax_compliance_status,
            bm.annual_revenue,
            bm.annual_revenue_range,
            bm.number_of_employees,
            bm.largest_contract_value,
            s.sector_name
         FROM fundingresponse fr
         INNER JOIN user u
            ON fr.user_id = u.user_id
         LEFT JOIN business_profile bp
            ON bp.user_id = u.user_id
         LEFT JOIN business_maturity bm
            ON bm.business_id = bp.business_id
         LEFT JOIN sector s
            ON bm.sector_id = s.sector_id
         WHERE fr.funding_id = ?
         ORDER BY fr.response_date DESC,
                  fr.funding_response_id DESC`,
        [funding_id]
    );

    return rows;
};

// =====================================================
// GET USER FUNDING APPLICATIONS
// =====================================================

const getMyFundingApplicationsService = async (user_id) => {
    const [rows] = await db.execute(
        `SELECT
            fr.*,
            f.title,
            f.institution_funder,
            f.description,
            f.status AS funding_status
         FROM fundingresponse fr
         INNER JOIN fundingopportunity f
            ON fr.funding_id = f.funding_id
         WHERE fr.user_id = ?
         ORDER BY fr.response_date DESC`,
        [user_id]
    );

    return rows;
};

// =====================================================
// UPDATE FUNDING RESPONSE STATUS
// =====================================================

const updateFundingResponseStatusService = async (
    funding_response_id,
    status
) => {
    const [result] = await db.execute(
        `UPDATE fundingresponse
         SET status = ?
         WHERE funding_response_id = ?`,
        [status, funding_response_id]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createFundingService,
    getAllFundingService,
    getFundingByIdService,
    updateFundingStatusService,
    applyForFundingService,
    getFundingResponsesService,
    getMyFundingApplicationsService,
    updateFundingResponseStatusService
};
