const createBusinessMaturity = async (
    connection,
    businessId,
    maturityData
) => {

    const {
        sector_id,
        services,

        number_of_employees,
        permanent_employees,
        contract_employees,

        employees_have_contracts,
        contracts_signed,

        annual_revenue,

        registered_with_uif,
        registered_with_coida,

        has_business_systems,

        has_accounting_system,
        accounting_system_name,

        can_produce_financial_statements,
        financial_statements_years,

        has_organisation_structure,
        roles_clearly_defined,

        has_payroll,
        payroll_management_description,

        largest_contract_value,

        assessment_date
    } = maturityData;


    // =====================================================
    // INSERT BUSINESS MATURITY
    // =====================================================

    const sql = `
        INSERT INTO business_maturity (

            business_id,

            sector_id,
            services,

            number_of_employees,
            permanent_employees,
            contract_employees,

            employees_have_contracts,
            contracts_signed,

            annual_revenue,

            registered_with_uif,
            registered_with_coida,

            has_business_systems,

            has_accounting_system,
            accounting_system_name,

            can_produce_financial_statements,
            financial_statements_years,

            has_organisation_structure,
            roles_clearly_defined,

            has_payroll,
            payroll_management_description,

            largest_contract_value,

            assessment_date

        )

        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `;


    const values = [

        businessId,

        sector_id || null,
        services || null,

        number_of_employees || 0,
        permanent_employees || 0,
        contract_employees || 0,

        employees_have_contracts || false,
        contracts_signed || false,

        annual_revenue || null,

        registered_with_uif || false,
        registered_with_coida || false,

        has_business_systems || false,

        has_accounting_system || false,
        accounting_system_name || null,

        can_produce_financial_statements || false,
        financial_statements_years || 0,

        has_organisation_structure || false,
        roles_clearly_defined || false,

        has_payroll || false,
        payroll_management_description || null,

        largest_contract_value || null,

        assessment_date || null
    ];


    const [result] = await connection.query(
        sql,
        values
    );


    return result.insertId;
};


module.exports = {
    createBusinessMaturity
};