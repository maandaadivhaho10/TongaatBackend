
const db = require("../../config/database");

// =====================================================
// GET RFQ WITH ALL RESPONSES AND SUPPLIER DETAILS
// =====================================================

async function getRFQWithResponses(rfqId) {

    // =====================================================
    // 1. GET RFQ DETAILS
    // =====================================================

    const rfqQuery = `
        SELECT
            r.rfq_id,
            r.title,
            r.description,
            r.closing_date,
            r.location,
            r.status,
            r.image_url,
            r.created_at AS date_posted,
            r.published_by,

            (
                SELECT COUNT(*)
                FROM rfq_response rr
                WHERE rr.rfq_id = r.rfq_id
            ) AS number_of_responses

        FROM rfqopportunity r

        WHERE r.rfq_id = ?
    `;

    const [rfqs] = await db.execute(
        rfqQuery,
        [rfqId]
    );

    if (rfqs.length === 0) {
        return null;
    }

    const rfq = rfqs[0];

    rfq.number_of_responses =
        Number(rfq.number_of_responses);

    // =====================================================
    // 2. GET RFQ TARGET SECTORS
    // =====================================================

    const sectorQuery = `
        SELECT
            s.sector_id,
            s.sector_name

        FROM rfq_sector rs

        INNER JOIN sector s
            ON rs.sector_id = s.sector_id

        WHERE rs.rfq_id = ?

        ORDER BY s.sector_name
    `;

    const [sectors] = await db.execute(
        sectorQuery,
        [rfqId]
    );

    rfq.sectors = sectors;

    // =====================================================
    // 3. GET RFQ RESPONSES AND SUPPLIER INFORMATION
    // =====================================================

    const responseQuery = `
        SELECT

            -- RFQ RESPONSE
            rr.rfq_response_id,
            rr.rfq_id,
            rr.proposal,
            rr.quoted_price,
            rr.quotation_document_path,
            rr.response_date,
            rr.status AS response_status,
            rr.email_sent,
            rr.email_sent_at,
            rr.created_at AS response_created_at,

            -- SUPPLIER PERSONAL INFORMATION
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
            bp.tax_compliance_status,

            CASE
                WHEN NULLIF(
                    TRIM(bp.tax_compliance_pin), ''
                ) IS NOT NULL
                THEN 1
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

            -- REGISTRATION STATUS
            CASE
                WHEN bp.business_id IS NOT NULL
                THEN 1 ELSE 0
            END AS has_business_profile,

            CASE
                WHEN bm.maturity_id IS NOT NULL
                THEN 1 ELSE 0
            END AS has_business_maturity,

            CASE
                WHEN bp.business_id IS NOT NULL
                 AND bm.maturity_id IS NOT NULL
                THEN 1 ELSE 0
            END AS registered_in_both

        FROM rfq_response rr

        INNER JOIN user u
            ON rr.user_id = u.user_id

        LEFT JOIN business_profile bp
            ON u.user_id = bp.user_id

        LEFT JOIN business_maturity bm
            ON bp.business_id = bm.business_id

        LEFT JOIN sector s
            ON bm.sector_id = s.sector_id

        WHERE rr.rfq_id = ?

        ORDER BY rr.response_date DESC
    `;

    const [rows] = await db.execute(
        responseQuery,
        [rfqId]
    );

    // =====================================================
    // 4. GET DOCUMENTS FOR ALL RESPONDING SUPPLIERS
    // =====================================================

    const businessIds = [
        ...new Set(
            rows
                .filter(row => row.business_id != null)
                .map(row => row.business_id)
        )
    ];

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
    // 5. GROUP DOCUMENTS BY BUSINESS ID
    // =====================================================

    const documentsByBusiness = new Map();

    for (const document of documents) {

        if (!documentsByBusiness.has(
            document.business_id
        )) {
            documentsByBusiness.set(
                document.business_id,
                []
            );
        }

        documentsByBusiness
            .get(document.business_id)
            .push(document);
    }

    // =====================================================
    // 6. FORMAT EACH RFQ RESPONSE
    // =====================================================

    const responses = rows.map(row => {

        const {
            rfq_response_id,
            rfq_id,
            proposal,
            quoted_price,
            quotation_document_path,
            response_date,
            response_status,
            email_sent,
            email_sent_at,
            response_created_at,
            ...supplier
        } = row;

        // ---------------------------------------------
        // SUPPLIER REGISTRATION STATUS
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
        // SUPPLIER DOCUMENTS
        // ---------------------------------------------

        const supplierDocuments =
            documentsByBusiness.get(
                supplier.business_id
            ) || [];

        const beeDocument = supplierDocuments.find(
            doc =>
                doc.document_type === "BEE_CERTIFICATE" ||
                doc.document_type === "BEE_AFFIDAVIT"
        );

        const financialDocument =
            supplierDocuments.find(
                doc =>
                    doc.document_type ===
                    "FINANCIAL_STATEMENT"
            );

        const companyDocument =
            supplierDocuments.find(
                doc =>
                    doc.document_type ===
                    "COMPANY_REGISTRATION"
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

        // ---------------------------------------------
        // TAX COMPLIANCE
        // ---------------------------------------------

        supplier.has_tax_compliance_pin =
            Boolean(supplier.has_tax_compliance_pin);

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
        // COMPANY REGISTRATION
        // ---------------------------------------------

        supplier.has_company_registration_document =
            Boolean(companyDocument);

        supplier.company_registration_document_url =
            companyDocument?.document_path || null;

        // ---------------------------------------------
        // DOCUMENT SUBMISSION STATUS
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

        // ---------------------------------------------
        // RETURN RESPONSE AND COMPLETE SUPPLIER
        // ---------------------------------------------

        return {
            rfq_response_id,
            rfq_id,

            proposal,

            quoted_price:
                quoted_price == null
                    ? null
                    : Number(quoted_price),

            quotation_document_path,

            response_date,
            status: response_status,
            email_sent: Boolean(email_sent),
            email_sent_at,
            created_at: response_created_at,

            supplier
        };
    });

    // =====================================================
    // 7. RETURN COMPLETE RFQ INFORMATION
    // =====================================================

    return {
        rfq,
        responses
    };
}

module.exports = {
    getRFQWithResponses
};
