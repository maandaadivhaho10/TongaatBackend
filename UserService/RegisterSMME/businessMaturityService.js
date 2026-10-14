
const db = require("../../config/database");

const {
    uploadDocument,
    deleteDocument
} = require("../azureDocumentService");

// =====================================================
// CREATE BUSINESS MATURITY
// =====================================================

const createBusinessMaturity = async (
    userId,
    data,
    clientReferences = [],
    files = {}
) => {

    let connection;
    let committed = false;

    const uploadedBlobNames = [];

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // =====================================================
        // 1. FIND BUSINESS USING USER ID
        // =====================================================

        const [businesses] = await connection.query(
            `SELECT business_id
             FROM business_profile
             WHERE user_id = ?`,
            [userId]
        );

        if (businesses.length === 0) {
            const error = new Error(
                "Business profile not found. Register your business first."
            );
            error.statusCode = 404;
            throw error;
        }

        const businessId = businesses[0].business_id;

        // =====================================================
        // 2. CHECK EXISTING MATURITY
        // =====================================================

        const [existing] = await connection.query(
            `SELECT maturity_id
             FROM business_maturity
             WHERE business_id = ?`,
            [businessId]
        );

        if (existing.length > 0) {
            const error = new Error(
                "Business maturity already registered"
            );
            error.statusCode = 409;
            throw error;
        }

        // =====================================================
        // 3. VALIDATE SECTOR
        // =====================================================

        if (data.sector_id != null) {

            const [sectors] = await connection.query(
                `SELECT sector_id
                 FROM sector
                 WHERE sector_id = ?`,
                [data.sector_id]
            );

            if (sectors.length === 0) {
                const error = new Error("Invalid sector_id");
                error.statusCode = 400;
                throw error;
            }
        }

        // =====================================================
        // 4. EXTRACT MATURITY DATA
        // =====================================================

        const {
            sector_id,
            services,
            number_of_employees,
            permanent_employees,
            contract_employees,
            employees_have_contracts,
            contracts_signed,
            annual_revenue,
            annual_revenue_range,
            registered_with_uif,
            registered_with_coida,
            coida_certificate_number,
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
        } = data;

        // =====================================================
        // 5. INSERT BUSINESS MATURITY
        // =====================================================

        const [result] = await connection.query(
            `INSERT INTO business_maturity (
                business_id,
                sector_id,
                services,
                number_of_employees,
                permanent_employees,
                contract_employees,
                employees_have_contracts,
                contracts_signed,
                annual_revenue,
                annual_revenue_range,
                registered_with_uif,
                registered_with_coida,
                coida_certificate_number,
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
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
                businessId,
                sector_id ?? null,
                services ?? null,
                number_of_employees ?? 0,
                permanent_employees ?? 0,
                contract_employees ?? 0,
                employees_have_contracts ?? 0,
                contracts_signed ?? 0,
                annual_revenue ?? null,
                annual_revenue_range ?? null,
                registered_with_uif ?? 0,
                registered_with_coida ?? 0,
                coida_certificate_number ?? null,
                has_business_systems ?? 0,
                has_accounting_system ?? 0,
                accounting_system_name ?? null,
                can_produce_financial_statements ?? 0,
                financial_statements_years ?? 0,
                has_organisation_structure ?? 0,
                roles_clearly_defined ?? 0,
                has_payroll ?? 0,
                payroll_management_description ?? null,
                largest_contract_value ?? null,
                assessment_date ?? null
            ]
        );

        const maturityId = result.insertId;

        // =====================================================
        // 6. INSERT CLIENT REFERENCES
        // =====================================================

        const savedReferences = [];

        for (const client of clientReferences) {

            const [referenceResult] = await connection.query(
                `INSERT INTO business_client_reference (
                    maturity_id,
                    client_name,
                    contact_number,
                    email,
                    work_done
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    maturityId,
                    client.client_name,
                    client.contact_number ?? null,
                    client.email ?? null,
                    client.work_done ?? null
                ]
            );

            savedReferences.push({
                reference_id: referenceResult.insertId,
                maturity_id: maturityId,
                ...client
            });
        }

        // =====================================================
        // 7. UPLOAD FINANCIAL STATEMENT TO AZURE
        // =====================================================

        const savedDocuments = [];

        const financialStatement =
            files?.financial_statement?.[0];

        if (financialStatement) {

            console.log(
                "Uploading financial statement for business:",
                businessId
            );

            // Wait for Azure upload to finish
            const uploaded = await uploadDocument(
                financialStatement,
                businessId
            );

            if (uploaded?.blob_name) {
                uploadedBlobNames.push(uploaded.blob_name);
            }

            if (
                !uploaded ||
                typeof uploaded.document_path !== "string" ||
                !uploaded.document_path.trim()
            ) {
                throw new Error(
                    "Azure upload did not return a valid financial statement URL"
                );
            }

            // =================================================
            // 8. SAVE FINANCIAL STATEMENT URL IN MYSQL
            // =================================================

            const [documentResult] = await connection.query(
                `INSERT INTO business_document (
                    business_id,
                    document_type,
                    document_name,
                    document_path
                ) VALUES (?, ?, ?, ?)`,
                [
                    businessId,
                    "FINANCIAL_STATEMENT",
                    uploaded.document_name,
                    uploaded.document_path
                ]
            );

            savedDocuments.push({
                document_id: documentResult.insertId,
                business_id: businessId,
                document_type: "FINANCIAL_STATEMENT",
                document_name: uploaded.document_name,
                document_path: uploaded.document_path
            });
        }

        // =====================================================
        // 9. COMMIT TRANSACTION
        // =====================================================

        await connection.commit();
        committed = true;

        return {
            maturity_id: maturityId,
            business_id: businessId,
            sector_id: sector_id ?? null,
            client_references: savedReferences,
            documents: savedDocuments,
            status: "REGISTERED"
        };

    } catch (error) {

        // =====================================================
        // 10. ROLLBACK MYSQL TRANSACTION
        // =====================================================

        if (connection && !committed) {

            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "MySQL rollback failed:",
                    rollbackError
                );
            }
        }

        // =====================================================
        // 11. CLEAN UP AZURE FILES
        // =====================================================

        if (!committed) {

            for (const blobName of uploadedBlobNames) {

                try {
                    await deleteDocument(blobName);
                } catch (deleteError) {
                    console.error(
                        "Azure cleanup failed:",
                        deleteError
                    );
                }
            }
        }

        throw error;

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    createBusinessMaturity
};
