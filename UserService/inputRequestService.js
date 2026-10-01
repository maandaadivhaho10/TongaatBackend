const createInputRequest = async (connection, requestData) => {
    const {
        user_id,
        request_type,
        input_name,
        quantity,
        reason,
        request_date
    } = requestData;

    const sql = `
        INSERT INTO input_request
        (
            user_id,
            request_type,
            input_name,
            quantity,
            
            reason,
            request_date
        )
        VALUES (?, ?, ?, ?, ?,?)
    `;

    const [result] = await connection.execute(sql, [
        user_id,
        request_type,
        input_name,
        quantity,
        reason,
        request_date
    ]);

    return {
        input_request_id: result.insertId,
        user_id,
        request_type,
        input_name,
        quantity,
        reason,
        request_date,
        status: "PENDING"
    };
};


const getInputRequests = async (connection) => {

    const sql = `
        SELECT 
            -- Input request details
            ir.input_request_id,
            ir.user_id,
            ir.request_type,
            ir.input_name,
            ir.quantity,
            ir.unit,
            ir.reason,
            ir.request_date,
            ir.status,
            ir.created_at,

            -- User details
            u.first_name,
            u.last_name,
            u.phone_number,
            u.email,
            u.province,
            u.city,
            u.address,
            u.postal_code,

            -- Business profile details
            bp.business_id,
            bp.business_name,
            bp.company_registration_number,
            bp.bwo_ownership_percentage,
            bp.bo_ownership_percentage,
            bp.bee_level,
            bp.business_address,
            bp.community,
            bp.attended_esd_program,
            bp.esd_institution,
            bp.received_grant_or_loan,
            bp.grant_loan_institution,
            bp.status AS business_status

        FROM input_request ir

        INNER JOIN user u
            ON ir.user_id = u.user_id

        LEFT JOIN business_profile bp
            ON ir.user_id = bp.user_id

        WHERE u.role_id = 1
          AND ir.status IN ('SUBMITTED', 'PENDING')

        ORDER BY ir.created_at DESC
    `;

    const [rows] = await connection.execute(sql);

    return rows;
};


const getInputRequestById = async (connection, inputRequestId) => {

    const sql = `
        SELECT
            ir.input_request_id,
            ir.user_id,
            u.first_name,
            u.last_name,
            ir.request_type,
            ir.input_name,
            ir.quantity,
            ir.unit,
            ir.reason,
            ir.request_date,
            ir.status,
            ir.created_at
        FROM input_request ir
        INNER JOIN user u
            ON ir.user_id = u.user_id
        WHERE ir.input_request_id = ?
    `;

    const [rows] = await connection.execute(sql, [
        inputRequestId
    ]);

    return rows[0] || null;
};


const getInputRequestsByUser = async (connection, userId) => {

    const sql = `
        SELECT
            input_request_id,
            user_id,
            request_type,
            input_name,
            quantity,
            unit,
            reason,
            request_date,
            status,
            created_at
        FROM input_request
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await connection.execute(sql, [
        userId
    ]);

    return rows;
};


const updateInputRequestStatus = async (
    connection,
    inputRequestId,
    status
) => {

    const sql = `
        UPDATE input_request
        SET status = ?
        WHERE input_request_id = ?
    `;

    const [result] = await connection.execute(sql, [
        status,
        inputRequestId
    ]);

    if (result.affectedRows === 0) {
        return null;
    }

    return await getInputRequestById(
        connection,
        inputRequestId
    );
};


module.exports = {
    createInputRequest,
    getInputRequests,
    getInputRequestById,
    getInputRequestsByUser,
    updateInputRequestStatus
};