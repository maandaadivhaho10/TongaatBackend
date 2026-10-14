
const db = require("../../config/database");

const {
    uploadDocument,
    deleteDocument
} = require("../azureDocumentService");

// =====================================================
// CREATE BUSINESS PROFILE
// =====================================================

const createBusinessProfile = async (
    userId,
    data,
    files = {}
) => {

    let connection;
    let committed = false;

    const uploadedBlobNames = [];

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // =====================================================
        // 1. CHECK IF BUSINESS PROFILE ALREADY EXISTS
        // =====================================================

        const [existing] = await connection.query(
            `SELECT business_id
             FROM business_profile
             WHERE user_id = ?`,
            [userId]
        );

        if (existing.length > 0) {
            const error = new Error(
                "Business profile already registered"
            );
            error.statusCode = 409;
            throw error;
        }

        // =====================================================
        // 2. INSERT BUSINESS PROFILE
        // =====================================================

        const [result] = await connection.query(
            `INSERT INTO business_profile (
                user_id,
                business_name,
                company_registration_number,
                bwo_ownership_percentage,
                bo_ownership_percentage,
                bee_level,
                has_bee_certificate,
                tax_compliance_pin,
                has_vat_registration,
                vat_registration_number,
                business_address,
                community,
                attended_esd_program,
                esd_institution,
                received_grant_or_loan,
                grant_loan_institution
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
                userId,
                data.business_name,
                data.company_registration_number ?? null,
                data.bwo_ownership_percentage ?? null,
                data.bo_ownership_percentage ?? null,
                data.bee_level ?? null,
                data.has_bee_certificate ?? null,
                data.tax_compliance_pin ?? null,
                data.has_vat_registration ?? null,
                data.vat_registration_number ?? null,
                data.business_address ?? null,
                data.community ?? null,
                data.attended_esd_program ?? 0,
                data.esd_institution ?? null,
                data.received_grant_or_loan ?? 0,
                data.grant_loan_institution ?? null
            ]
        );

        const businessId = result.insertId;

        // =====================================================
        // 3. PREPARE DOCUMENT TYPES
        // =====================================================

        const fileTypes = {
            company_registration_document: "COMPANY_REGISTRATION"
        };

        if (data.has_bee_certificate === 1) {
            fileTypes.bee_document = "BEE_CERTIFICATE";
        } else if (data.has_bee_certificate === 0) {
            fileTypes.bee_document = "BEE_AFFIDAVIT";
        }

        // =====================================================
        // 4. UPLOAD DOCUMENTS AND INSERT METADATA
        // =====================================================

        const savedDocuments = [];

        for (const [fieldName, documentType] of Object.entries(fileTypes)) {

            const file = files?.[fieldName]?.[0];

            if (!file) continue;

            // WAIT UNTIL AZURE UPLOAD FINISHES
            const uploaded = await uploadDocument(
                file,
                businessId
            );

            uploadedBlobNames.push(uploaded.blob_name);

            if (
                !uploaded.document_path ||
                typeof uploaded.document_path !== "string"
            ) {
                throw new Error(
                    `Azure did not return a valid document URL for ${fieldName}`
                );
            }

            // SAVE DOCUMENT TO MYSQL
            const [documentResult] = await connection.query(
                `INSERT INTO business_document (
                    business_id,
                    document_type,
                    document_name,
                    document_path
                ) VALUES (?, ?, ?, ?)`,
                [
                    businessId,
                    documentType,
                    uploaded.document_name,
                    uploaded.document_path
                ]
            );

            savedDocuments.push({
                document_id: documentResult.insertId,
                business_id: businessId,
                document_type: documentType,
                document_name: uploaded.document_name,
                document_path: uploaded.document_path
            });
        }

        // =====================================================
        // 5. COMMIT MYSQL TRANSACTION
        // =====================================================

        await connection.commit();

        committed = true;

        return {
            business_id: businessId,
            user_id: userId,
            business_name: data.business_name,
            status: "ACTIVE",
            documents: savedDocuments
        };

    } catch (error) {

        // =====================================================
        // 6. ROLLBACK MYSQL
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
        // 7. DELETE UPLOADED AZURE FILES
        // =====================================================

        if (!committed) {

            for (const blobName of uploadedBlobNames) {

                try {
                    await deleteDocument(blobName);
                } catch (deleteError) {
                    console.error(
                        `Failed to delete Azure blob ${blobName}:`,
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
    createBusinessProfile
};
