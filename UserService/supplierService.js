const db = require("../config/database");

// =====================================================
// GET ALL SUPPLIERS
// ROLE ID = 1
// =====================================================

async function getAllSuppliers() {

    // =====================================================
    // GET ALL ACTIVE SMME USERS
    // INCLUDING THOSE WITHOUT BUSINESS REGISTRATION
    // =====================================================

    const query = `
        SELECT
            u.user_id,
            u.title,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,

            -- BUSINESS PROFILE
            bp.business_id,
            bp.business_name,
            bp.company_registration_number,
            bp.business_address,
            bp.community,
            bp.status AS business_status,
            bp.bee_level,
            bp.bwo_ownership_percentage,
            bp.bo_ownership_percentage,
            bp.has_bee_certificate,
            bp.has_vat_registration,
            bp.vat_registration_number,

            -- TAX COMPLIANCE PIN
            bp.tax_compliance_pin,

            -- TAX COMPLIANCE PIN AVAILABILITY
            CASE
                WHEN NULLIF(TRIM(bp.tax_compliance_pin), '')
                     IS NOT NULL THEN 1
                ELSE 0
            END AS has_tax_compliance_pin,

            -- BUSINESS MATURITY
            bm.maturity_id,
            bm.services,
            bm.annual_revenue,
            bm.annual_revenue_range,
            bm.number_of_employees,
            bm.permanent_employees,
            bm.contract_employees,
            bm.largest_contract_value,
            bm.can_produce_financial_statements,
            bm.financial_statements_years,

            -- INDUSTRY
            s.sector_id,
            s.sector_name AS industry,

            -- BUSINESS PROFILE REGISTRATION
            CASE
                WHEN bp.business_id IS NOT NULL THEN 1
                ELSE 0
            END AS has_business_profile,

            -- BUSINESS MATURITY REGISTRATION
            CASE
                WHEN bm.maturity_id IS NOT NULL THEN 1
                ELSE 0
            END AS has_business_maturity,

            -- REGISTERED IN BOTH TABLES
            CASE
                WHEN bp.business_id IS NOT NULL
                 AND bm.maturity_id IS NOT NULL
                THEN 1
                ELSE 0
            END AS registered_in_both

        FROM user u

        LEFT JOIN business_profile bp
            ON u.user_id = bp.user_id

        LEFT JOIN business_maturity bm
            ON bp.business_id = bm.business_id

        LEFT JOIN sector s
            ON bm.sector_id = s.sector_id

        WHERE u.role_id = 1
          AND u.status = 'ACTIVE'

        ORDER BY u.created_at DESC
    `;

    const [suppliers] = await db.execute(query);

    if (suppliers.length === 0) {
        return [];
    }

    // =====================================================
    // GET DOCUMENTS FOR REGISTERED BUSINESSES
    // =====================================================

    const businessIds = suppliers
        .filter(supplier => supplier.business_id != null)
        .map(supplier => supplier.business_id);

    let documents = [];

    if (businessIds.length > 0) {

        const placeholders = businessIds
            .map(() => "?")
            .join(",");

        const documentQuery = `
            SELECT
                document_id,
                business_id,
                document_type,
                document_name,
                document_path,
                uploaded_at
            FROM business_document
            WHERE business_id IN (${placeholders})
              AND status = 'ACTIVE'
            ORDER BY uploaded_at DESC
        `;

        const [results] = await db.execute(
            documentQuery,
            businessIds
        );

        documents = results;
    }

    // =====================================================
    // GROUP DOCUMENTS BY BUSINESS ID
    // =====================================================

    const documentsByBusiness = new Map();

    for (const document of documents) {

        if (!documentsByBusiness.has(document.business_id)) {
            documentsByBusiness.set(document.business_id, []);
        }

        documentsByBusiness
            .get(document.business_id)
            .push(document);
    }

    // =====================================================
    // FORMAT EACH SUPPLIER
    // =====================================================

    for (const supplier of suppliers) {

        // ---------------------------------------------
        // REGISTRATION STATUS
        // ---------------------------------------------

        supplier.has_business_profile =
            Boolean(supplier.has_business_profile);

        supplier.has_business_maturity =
            Boolean(supplier.has_business_maturity);

        supplier.registered_in_both =
            Boolean(supplier.registered_in_both);

        supplier.registration_status =
            supplier.registered_in_both
                ? "COMPLETED"
                : supplier.has_business_profile
                    ? "MATURITY_PENDING"
                    : "BUSINESS_PROFILE_PENDING";

        // ---------------------------------------------
        // GET SUPPLIER DOCUMENTS
        // ---------------------------------------------

        const supplierDocuments =
            documentsByBusiness.get(supplier.business_id) || [];

        const beeDocument = supplierDocuments.find(
            document =>
                document.document_type === "BEE_CERTIFICATE" ||
                document.document_type === "BEE_AFFIDAVIT"
        );

        const financialDocument = supplierDocuments.find(
            document =>
                document.document_type === "FINANCIAL_STATEMENT"
        );

        const companyDocument = supplierDocuments.find(
            document =>
                document.document_type === "COMPANY_REGISTRATION"
        );

        // ---------------------------------------------
        // B-BBEE INFORMATION
        // ---------------------------------------------

        supplier.has_bee_certificate =
            supplier.has_bee_certificate == null
                ? null
                : Boolean(supplier.has_bee_certificate);

        supplier.bee_document_submitted =
            Boolean(beeDocument);

        supplier.bee_document_type =
            beeDocument?.document_type || null;

        supplier.bee_document_url =
            beeDocument?.document_path || null;

        supplier.bee_document_name =
            beeDocument?.document_name || null;

        // ---------------------------------------------
        // VAT INFORMATION
        // ---------------------------------------------

        supplier.has_vat_registration =
            supplier.has_vat_registration == null
                ? null
                : Boolean(supplier.has_vat_registration);

        // vat_registration_number is already
        // returned in the main query.

        // ---------------------------------------------
        // TAX COMPLIANCE PIN
        // ---------------------------------------------

        supplier.has_tax_compliance_pin =
            Boolean(supplier.has_tax_compliance_pin);

        // The actual tax_compliance_pin is already
        // returned from the SQL query.

        // ---------------------------------------------
        // FINANCIAL STATEMENTS
        // ---------------------------------------------

        supplier.can_produce_financial_statements =
            supplier.can_produce_financial_statements == null
                ? null
                : Boolean(
                    supplier.can_produce_financial_statements
                );

        supplier.has_financial_statement =
            Boolean(financialDocument);

        supplier.financial_statement_url =
            financialDocument?.document_path || null;

        supplier.financial_statement_name =
            financialDocument?.document_name || null;

        // ---------------------------------------------
        // COMPANY REGISTRATION DOCUMENT
        // ---------------------------------------------

        supplier.has_company_registration_document =
            Boolean(companyDocument);

        supplier.company_registration_document_url =
            companyDocument?.document_path || null;

        // ---------------------------------------------
        // DOCUMENT STATUS
        // ---------------------------------------------

        supplier.document_status = {

            bee_document:
                beeDocument
                    ? "SUBMITTED"
                    : "NOT_SUBMITTED",

            financial_statement:
                financialDocument
                    ? "SUBMITTED"
                    : "NOT_SUBMITTED",

            company_registration:
                companyDocument
                    ? "SUBMITTED"
                    : "NOT_SUBMITTED",

            vat_registration:
                supplier.has_vat_registration === true
                    ? "REGISTERED"
                    : supplier.has_vat_registration === false
                        ? "NOT_REGISTERED"
                        : "NOT_PROVIDED",

            tax_compliance_pin:
                supplier.has_tax_compliance_pin
                    ? "PROVIDED"
                    : "NOT_PROVIDED"
        };

        supplier.documents = supplierDocuments;
    }

    return suppliers;
}

//=================================================
// GET SUPPLIER BY USER ID
// =====================================================

async function getSupplierById(userId) {

    const query = `
        SELECT
            u.user_id,
            u.title,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,

            bp.business_id,
            bp.business_name,
            bp.business_address,
            bp.bee_level,
            bp.bwo_ownership_percentage,
            bp.bo_ownership_percentage,

            s.sector_id,
            s.sector_name AS industry,

            bm.services,
            bm.annual_revenue,
            bm.permanent_employees,
            bm.largest_contract_value

        FROM user u

        INNER JOIN business_profile bp
            ON u.user_id = bp.user_id

        LEFT JOIN business_maturity bm
            ON bp.business_id = bm.business_id

        LEFT JOIN sector s
            ON bm.sector_id = s.sector_id

        WHERE u.user_id = ?
          AND u.role_id = 1
    `;

    const [rows] = await db.execute(
        query,
        [userId]
    );


    if (rows.length === 0) {
        return null;
    }


    const supplier = rows[0];


    // =====================================================
    // GET DOCUMENTS
    // =====================================================

    const documentQuery = `
        SELECT
            document_id,
            document_type,
            document_name,
            document_path,
            uploaded_at
        FROM business_document
        WHERE business_id = ?
          AND status = 'ACTIVE'
        ORDER BY uploaded_at DESC
    `;


    const [documents] = await db.execute(
        documentQuery,
        [supplier.business_id]
    );


    supplier.documents = documents;


    return supplier;
}


module.exports = {
    getAllSuppliers,
    getSupplierById
};