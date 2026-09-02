const createBusinessProfile = async (
    connection,
    userId,
    businessData
) => {

    const {
        business_name,
        company_registration_number,
        bwo_ownership_percentage,
        bo_ownership_percentage,
        bee_level,
        business_address,
        community,
        attended_esd_program,
        esd_institution,
        received_grant_or_loan,
        grant_loan_institution
    } = businessData;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!business_name) {
        throw new Error("Business name is required");
    }


    // =====================================================
    // CHECK COMPANY REGISTRATION NUMBER
    // =====================================================

    if (company_registration_number) {

        const [existingRegistration] = await connection.query(
            `
            SELECT business_id
            FROM business_profile
            WHERE company_registration_number = ?
            `,
            [company_registration_number]
        );


        if (existingRegistration.length > 0) {
            throw new Error(
                "Company registration number is already registered"
            );
        }
    }


    // =====================================================
    // INSERT BUSINESS PROFILE
    // =====================================================

    const sql = `
        INSERT INTO business_profile (

            user_id,

            business_name,
            company_registration_number,

            bwo_ownership_percentage,
            bo_ownership_percentage,

            bee_level,

            business_address,
            community,

            attended_esd_program,
            esd_institution,

            received_grant_or_loan,
            grant_loan_institution

        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [

        userId,

        business_name,
        company_registration_number || null,

        bwo_ownership_percentage || null,
        bo_ownership_percentage || null,

        bee_level || null,

        business_address || null,
        community || null,

        attended_esd_program || false,
        esd_institution || null,

        received_grant_or_loan || false,
        grant_loan_institution || null
    ];


    const [result] = await connection.query(
        sql,
        values
    );


    return result.insertId;
};


module.exports = {
    createBusinessProfile
};