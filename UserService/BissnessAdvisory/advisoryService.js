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
// 
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
            bp.has_bee_certificate,
            bp.bwo_ownership_percentage,
            bp.bo_ownership_percentage,
            bp.business_address,
            bp.community,
            bp.tax_compliance_pin,
            bp.tax_compliance_status,
            bp.has_vat_registration,

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
    // 3. FETCH ACTIVE BUSINESS DOCUMENTS
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
              AND status = 'ACTIVE'

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

        // Documents are sorted newest first, so find()
        // returns the latest upload of each type.
        const findDocument = (...types) =>
            supplierDocuments.find(doc =>
                types.includes(doc.document_type)
            );

        const beeDocument = findDocument(
            "BEE_CERTIFICATE",
            "BEE_AFFIDAVIT"
        );
        const financialDocument = findDocument("FINANCIAL_STATEMENT");
        const companyDocument = findDocument("COMPANY_REGISTRATION");
        const vatDocument = findDocument("VAT_REGISTRATION");
        const contractDocument = findDocument("CONTRACT_DOCUMENT");

        const vatRegistered =
            row.has_vat_registration === 1 ||
            row.has_vat_registration === true;

        const taxPinProvided =
            Number(row.has_tax_compliance_pin) === 1;

        // ==============================================
        // DOCUMENT STATUS
        // ==============================================

        const documentStatus = {

            bee_document: beeDocument
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            financial_statement: financialDocument
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            company_registration: companyDocument
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            // VAT registered -> a document is expected
            vat_registration: vatRegistered
                ? (vatDocument ? "SUBMITTED" : "MISSING")
                : "NOT_REGISTERED",

            contract_document: contractDocument
                ? "SUBMITTED"
                : "NOT_SUBMITTED",

            tax_compliance_pin: taxPinProvided
                ? "PROVIDED"
                : "NOT_PROVIDED"
        };

        // ==============================================
        // MATURITY SCORE (out of 4, 1 point each)
        //   1. B-BBEE certificate (an affidavit earns 0)
        //   2. Financial statement
        //   3. VAT registration document
        //   4. Contract document
        // Company registration and the tax PIN add no points.
        // ==============================================

        const scoreItems = {
            bee_certificate:
                beeDocument?.document_type === "BEE_CERTIFICATE",
            financial_statement: Boolean(financialDocument),
            vat_document: Boolean(vatDocument),
            contract_document: Boolean(contractDocument)
        };

        const provided =
            Object.values(scoreItems).filter(Boolean).length;

        const totalPoints = Object.keys(scoreItems).length; // 4

        const documentScore = {
            provided,
            total: totalPoints,
            percentage: Math.round((provided / totalPoints) * 100),
            breakdown: scoreItems
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

            advisory_request_id: row.advisory_request_id,
            user_id: row.user_id,
            subject: row.subject,
            description: row.description,
            request_date: row.request_date,
            preferred_date: row.preferred_date,
            status: row.advisory_status,
            assigned_to: row.assigned_to,
            created_at: row.advisory_created_at,

            // ==========================================
            // SUPPLIER INFORMATION
            // ==========================================

            supplier: {

                // USER INFORMATION
                user_id: row.user_id,
                title: row.title,
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email,
                phone_number: row.phone_number,
                gender: row.gender,

                // BUSINESS PROFILE
                business_id: row.business_id,
                business_name: row.business_name,
                company_registration_number:
                    row.company_registration_number,
                bee_level: formattedBeeLevel,
                bwo_ownership_percentage: row.bwo_ownership_percentage,
                bo_ownership_percentage: row.bo_ownership_percentage,
                business_address: row.business_address,
                community: row.community,

                // BUSINESS MATURITY
                maturity_id: row.maturity_id,
                industry: row.industry,
                services: row.services,
                number_of_employees: row.number_of_employees,
                permanent_employees: row.permanent_employees,
                contract_employees: row.contract_employees,
                annual_revenue: row.annual_revenue,
                annual_revenue_range: row.annual_revenue_range,
                largest_contract_value: row.largest_contract_value,
                can_produce_financial_statements:
                    row.can_produce_financial_statements == null
                        ? null
                        : Boolean(row.can_produce_financial_statements),

                // REGISTRATION
                registered_in_both: true,

                // B-BBEE DOCUMENT
                has_bee_certificate:
                    row.has_bee_certificate == null
                        ? null
                        : Boolean(row.has_bee_certificate),
                bee_document_submitted: Boolean(beeDocument),
                bee_document_type: beeDocument?.document_type || null,
                bee_document_url: beeDocument?.document_path || null,
                bee_document_name: beeDocument?.document_name || null,

                // VAT (document instead of VAT number)
                has_vat_registration: vatRegistered,
                has_vat_document: Boolean(vatDocument),
                vat_document_url: vatDocument?.document_path || null,
                vat_document_name: vatDocument?.document_name || null,

                // FINANCIAL STATEMENT (optional)
                has_financial_statement: Boolean(financialDocument),
                financial_statement_url:
                    financialDocument?.document_path || null,
                financial_statement_name:
                    financialDocument?.document_name || null,

                // CONTRACT DOCUMENT (optional)
                has_contract_document: Boolean(contractDocument),
                contract_document_url:
                    contractDocument?.document_path || null,
                contract_document_name:
                    contractDocument?.document_name || null,

                // COMPANY REGISTRATION DOCUMENT
                has_company_registration_document: Boolean(companyDocument),
                company_registration_document_url:
                    companyDocument?.document_path || null,
                company_registration_document_name:
                    companyDocument?.document_name || null,

                // TAX COMPLIANCE
                tax_compliance_pin: row.tax_compliance_pin,
                has_tax_compliance_pin: taxPinProvided,
                tax_compliance_status:
                    row.tax_compliance_status || "NOT_VERIFIED",

                // DOCUMENTS
                document_status: documentStatus,
                document_score: documentScore,
                documents: supplierDocuments
            }
        };
    });
};

 // ======================================================
 // UPDATE BUSINESS ADVISORY REQUEST STATUS
 // ======================================================

const updateAdvisoryRequestStatusService = async (
    advisory_request_id,
    status
) => {

    // ==============================================
    // 1. VALIDATE STATUS
    // ==============================================

    const allowedStatuses = [
        "PENDING",
        "IN REVIEW",
        "COMPLETED"
    ];

    const normalizedStatus = String(status || "")
        .trim()
        .toUpperCase()
        .replace(/_/g, " ");

    if (!allowedStatuses.includes(normalizedStatus)) {
        const error = new Error(
            "Invalid status. Allowed statuses: PENDING, IN REVIEW, COMPLETED"
        );
        error.statusCode = 400;
        throw error;
    }

    // ==============================================
    // 2. CHECK IF ADVISORY REQUEST EXISTS
    // ==============================================

    const [existingRequests] = await db.execute(
        `
        SELECT
            advisory_request_id,
            user_id,
            subject,
            status
        FROM business_advisory_request
        WHERE advisory_request_id = ?
        LIMIT 1
        `,
        [advisory_request_id]
    );

    if (existingRequests.length === 0) {
        const error = new Error(
            "Business advisory request not found"
        );
        error.statusCode = 404;
        throw error;
    }

    // ==============================================
    // 3. UPDATE STATUS
    // ==============================================

    await db.execute(
        `
        UPDATE business_advisory_request
        SET status = ?
        WHERE advisory_request_id = ?
        `,
        [
            normalizedStatus,
            advisory_request_id
        ]
    );

    // ==============================================
    // 4. FETCH UPDATED REQUEST
    // ==============================================

    const [updatedRequests] = await db.execute(
        `
        SELECT
            advisory_request_id,
            user_id,
            subject,
            description,
            request_date,
            status
        FROM business_advisory_request
        WHERE advisory_request_id = ?
        LIMIT 1
        `,
        [advisory_request_id]
    );

    return updatedRequests[0];
};



 // ======================================================
 // GET BUSINESS ADVISORY REQUESTS FOR LOGGED-IN SUPPLIER
 // ======================================================

const getSupplierAdvisoryRequestsService = async (user_id) => {

    const query = `
        SELECT
            advisory_request_id,
            user_id,
            subject,
            description,
            request_date,
            preferred_date,
            status,
            created_at
        FROM business_advisory_request
        WHERE user_id = ?
        ORDER BY
            request_date DESC,
            advisory_request_id DESC
    `;

    const [rows] = await db.execute(
        query,
        [user_id]
    );

    return rows;
};


module.exports = {
    createAdvisoryService,getAllBusinessAdvisoryRequests,updateAdvisoryRequestStatusService,getSupplierAdvisoryRequestsService
};