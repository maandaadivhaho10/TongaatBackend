const db = require("../../config/database");

const createAdvisoryService = async ({
    user_id,
    subject,
    description,
    request_date,
    preferred_date
}) => {

    const query = `
        INSERT INTO business_advisory_request
        (
            user_id,
            subject,
            description,
            request_date,
            preferred_date,
            status
        )
        VALUES (?, ?, ?, ?, ?, 'PENDING')
    `;

    console.log("Starting advisory insert...");

    const [result] = await db.execute(
        {
            sql: query,
            timeout: 10000
        },
        [
            user_id,
            subject,
            description,
            request_date,
            preferred_date ?? null
        ]
    );

    console.log("Advisory insert completed:", result.insertId);

    return {
        advisory_request_id: result.insertId,
        user_id,
        subject,
        description,
        request_date,
        preferred_date: preferred_date ?? null,
        status: "PENDING"
    };
};

// ======================================================
// GET ALL BUSINESS ADVISORY REQUESTS
// ONLY SUPPLIERS WITH BUSINESS PROFILE + BUSINESS MATURITY
// ======================================================

const getAllBusinessAdvisoryRequests = async () => {

    // ==================================================
    // 1. FETCH ADVISORY REQUESTS AND SUPPLIER INFORMATION
    // ==================================================

    const [rows] = await db.execute(`
        SELECT
            ar.advisory_request_id,
            ar.user_id,
            ar.subject,
            ar.description,
            ar.request_date,
            ar.preferred_date,
            ar.status AS advisory_status,
            ar.assigned_to,
            ar.created_at AS advisory_created_at,

            u.title,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            u.gender,

            bp.business_id,
            bp.business_name,
            bp.company_registration_number,
            bp.bee_level,
            bp.bwo_ownership_percentage,
            bp.bo_ownership_percentage,
            bp.business_address,
            bp.community,
            bp.tax_compliance_status,
            bp.has_vat_registration,
            bp.vat_registration_number,

            CASE
                WHEN NULLIF(
                    TRIM(bp.tax_compliance_pin), ''
                ) IS NOT NULL
                THEN 1
                ELSE 0
            END AS has_tax_compliance_pin,

            bm.maturity_id,
            bm.services,
            bm.number_of_employees,
            bm.permanent_employees,
            bm.contract_employees,
            bm.annual_revenue,
            bm.annual_revenue_range,
            bm.largest_contract_value,
            bm.can_produce_financial_statements,

            s.sector_name AS industry

        FROM business_advisory_request ar

        INNER JOIN user u
            ON ar.user_id = u.user_id

        INNER JOIN business_profile bp
            ON bp.user_id = u.user_id

        INNER JOIN business_maturity bm
            ON bm.business_id = bp.business_id

        LEFT JOIN sector s
            ON s.sector_id = bm.sector_id

        ORDER BY
            ar.request_date DESC,
            ar.advisory_request_id DESC
    `);

    // ==================================================
    // 2. COLLECT UNIQUE BUSINESS IDS
    // ==================================================

    const businessIds = [
        ...new Set(
            rows
                .map(row => row.business_id)
                .filter(id => id != null)
        )
    ];

    // ==================================================
    // 3. FETCH BUSINESS DOCUMENTS
    // ==================================================

    let documents = [];

    if (businessIds.length > 0) {

        const placeholders = businessIds
            .map(() => "?")
            .join(",");

        const [documentRows] = await db.execute(
            `
            SELECT
                document_id,
                business_id,
                document_type,
                document_name,
                document_path,
                status,
                uploaded_at

            FROM business_document

            WHERE business_id IN (${placeholders})

            ORDER BY uploaded_at DESC
            `,
            businessIds
        );

        documents = documentRows;
    }

    // ==================================================
    // 4. GROUP DOCUMENTS BY BUSINESS ID
    // ==================================================

    const documentsByBusiness = new Map();

    for (const document of documents) {

        const list =
            documentsByBusiness.get(document.business_id) || [];

        list.push(document);

        documentsByBusiness.set(
            document.business_id,
            list
        );
    }

    // ==================================================
    // 5. FORMAT API RESPONSE
    // ==================================================

    return rows.map(row => {

        const supplierDocuments =
            documentsByBusiness.get(row.business_id) || [];

        // ==============================================
        // CHECK DOCUMENT AVAILABILITY
        // ==============================================

        const hasDocument = types =>
            supplierDocuments.some(doc =>
                types.includes(doc.document_type)
            );

        const beeSubmitted = hasDocument([
            "BEE_CERTIFICATE",
            "BEE_AFFIDAVIT"
        ]);

        const financialSubmitted = hasDocument([
            "FINANCIAL_STATEMENT"
        ]);

        const registrationSubmitted = hasDocument([
            "COMPANY_REGISTRATION"
        ]);

        const vatRegistered =
            row.has_vat_registration === 1 ||
            row.has_vat_registration === true;

        const taxPinProvided =
            Number(row.has_tax_compliance_pin) === 1;

        // ==============================================
        // DOCUMENT STATUS
        // ==============================================

        const documentStatus = {

            bee_document: beeSubmitted
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            financial_statement: financialSubmitted
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            company_registration: registrationSubmitted
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            vat_registration: vatRegistered
                ? "REGISTERED"
                : "NOT_REGISTERED",

            tax_compliance_pin: taxPinProvided
                ? "PROVIDED"
                : "NOT_PROVIDED"
        };

        // ==============================================
        // DOCUMENT SCORE
        // ==============================================

        const provided = Object.values(documentStatus)
            .filter(value =>
                [
                    "SUBMITTED",
                    "REGISTERED",
                    "PROVIDED"
                ].includes(value)
            ).length;

        const documentScore = {
            provided,
            total: 5,
            percentage: Math.round(
                (provided / 5) * 100
            )
        };

        // ==============================================
        // FORMAT B-BBEE LEVEL
        // ==============================================

        const beeLevel =
            row.bee_level == null
                ? null
                : String(row.bee_level).trim();

        const formattedBeeLevel = beeLevel
            ? /^[1-8]$/.test(beeLevel)
                ? `Level ${beeLevel}`
                : beeLevel
            : null;

        // ==============================================
        // RETURN ADVISORY REQUEST + SUPPLIER
        // ==============================================

        return {

            advisory_request_id:
                row.advisory_request_id,

            user_id:
                row.user_id,

            subject:
                row.subject,

            description:
                row.description,

            request_date:
                row.request_date,

            preferred_date:
                row.preferred_date,

            status:
                row.advisory_status,

            assigned_to:
                row.assigned_to,

            created_at:
                row.advisory_created_at,

            // ==========================================
            // SUPPLIER INFORMATION
            // ==========================================

            supplier: {

                // USER INFORMATION

                user_id:
                    row.user_id,

                title:
                    row.title,

                first_name:
                    row.first_name,

                last_name:
                    row.last_name,

                email:
                    row.email,

                phone_number:
                    row.phone_number,

                gender:
                    row.gender,

                // BUSINESS PROFILE

                business_id:
                    row.business_id,

                business_name:
                    row.business_name,

                company_registration_number:
                    row.company_registration_number,

                bee_level:
                    formattedBeeLevel,

                bwo_ownership_percentage:
                    row.bwo_ownership_percentage,

                bo_ownership_percentage:
                    row.bo_ownership_percentage,

                business_address:
                    row.business_address,

                community:
                    row.community,

                // BUSINESS MATURITY

                maturity_id:
                    row.maturity_id,

                industry:
                    row.industry,

                services:
                    row.services,

                number_of_employees:
                    row.number_of_employees,

                permanent_employees:
                    row.permanent_employees,

                contract_employees:
                    row.contract_employees,

                annual_revenue:
                    row.annual_revenue,

                annual_revenue_range:
                    row.annual_revenue_range,

                largest_contract_value:
                    row.largest_contract_value,

                can_produce_financial_statements:
                    row.can_produce_financial_statements,

                // REGISTRATION

                registered_in_both: true,

                // VAT

                has_vat_registration:
                    vatRegistered,

                vat_registration_number:
                    row.vat_registration_number,

                // TAX COMPLIANCE

                has_tax_compliance_pin:
                    taxPinProvided,

                tax_compliance_status:
                    row.tax_compliance_status ||
                    "NOT_VERIFIED",

                // DOCUMENTS

                document_status:
                    documentStatus,

                document_score:
                    documentScore,

                documents:
                    supplierDocuments
            }
        };
    });
};

    



module.exports = {
    createAdvisoryService,getAllBusinessAdvisoryRequests
};