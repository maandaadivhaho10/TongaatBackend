const db = require("../config/database");

const {
    createUser
} = require("../UserService/userService");

const {
    createBusinessProfile
} = require("../UserService/businessProfileService");

const {
    createBusinessMaturity
} = require("../UserService/businessMaturityService");

const {
    createClientReferences
} = require("../UserService/clientReferenceService");

const {
    createBusinessDocuments
} = require("../UserService/businessDocumentService");

const {
    uploadDocument
} = require("../UserService/azureDocumentService");


const registerSmme = async (req, res) => {

    let connection;

    // Keep track of uploaded Azure files
    // so they can be deleted if the database transaction fails
    const uploadedFiles = [];

    try {

        // =====================================================
        // GET DATABASE CONNECTION
        // =====================================================

        connection = await db.getConnection();


        // =====================================================
        // START TRANSACTION
        // =====================================================

        await connection.beginTransaction();


        // =====================================================
        // CREATE USER
        // =====================================================
console.log("BODY:", req.body);
console.log("FILES:", req.files);
        const user = await createUser(
            connection,
            req.body
        );


        // =====================================================
        // MAKE SURE ROLE IS SMME
        // =====================================================

        if (
            user.role_name.toUpperCase() !== "SMME"
        ) {

            throw new Error(
                "This endpoint is only for SMMEs"
            );
        }


        // =====================================================
        // PARSE BUSINESS PROFILE
        // =====================================================

        let businessProfile;

        if (!req.body.business_profile) {

            throw new Error(
                "Business profile information is required"
            );
        }

        try {

            businessProfile =
                typeof req.body.business_profile === "string"
                    ? JSON.parse(req.body.business_profile)
                    : req.body.business_profile;

        } catch (error) {

            throw new Error(
                "Invalid business_profile JSON"
            );
        }


        // =====================================================
        // CREATE BUSINESS PROFILE
        // =====================================================

        const businessId =
            await createBusinessProfile(
                connection,
                user.user_id,
                businessProfile
            );


        // =====================================================
        // VALIDATE BUSINESS DOCUMENTS
        // =====================================================

        if (
            !req.files ||
            req.files.length === 0
        ) {

            throw new Error(
                "Business documents are required"
            );
        }


        // =====================================================
        // UPLOAD BUSINESS DOCUMENTS TO AZURE
        // =====================================================

        const documents = [];

        for (const file of req.files) {

            const uploadedDocument =
                await uploadDocument(
                    file,
                    businessId
                );

            // Save the Azure file information
            documents.push({
                document_type: file.fieldname,
                document_name: uploadedDocument.document_name,
                document_path: uploadedDocument.document_path
            });

            // Keep track for cleanup if transaction fails
            uploadedFiles.push(
                uploadedDocument.document_path
            );
        }


        // =====================================================
        // SAVE DOCUMENT INFORMATION IN DATABASE
        // =====================================================

        await createBusinessDocuments(
            connection,
            businessId,
            documents
        );


        // =====================================================
        // VALIDATE MATURITY
        // =====================================================

        let businessMaturity;

        if (!req.body.business_maturity) {

            throw new Error(
                "Business maturity information is required"
            );
        }

        try {

            businessMaturity =
                typeof req.body.business_maturity === "string"
                    ? JSON.parse(req.body.business_maturity)
                    : req.body.business_maturity;

        } catch (error) {

            throw new Error(
                "Invalid business_maturity JSON"
            );
        }


        // =====================================================
        // CREATE BUSINESS MATURITY
        // =====================================================

        const maturityId =
            await createBusinessMaturity(
                connection,
                businessId,
                businessMaturity
            );


        // =====================================================
        // CREATE CLIENT REFERENCES
        // =====================================================

        let clientReferences = [];

        if (req.body.client_references) {

            try {

                clientReferences =
                    typeof req.body.client_references === "string"
                        ? JSON.parse(req.body.client_references)
                        : req.body.client_references;

            } catch (error) {

                throw new Error(
                    "Invalid client_references JSON"
                );
            }
        }


        await createClientReferences(
            connection,
            maturityId,
            clientReferences
        );


        // =====================================================
        // COMMIT EVERYTHING
        // =====================================================

        await connection.commit();


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            message: "SMME registered successfully",

            data: {
                user_id: user.user_id,
                business_id: businessId,
                maturity_id: maturityId
            }

        });


    } catch (error) {

        // =====================================================
        // ROLLBACK DATABASE
        // =====================================================

        if (connection) {
            await connection.rollback();
        }


        console.error(
            "SMME registration error:",
            error
        );


        // =====================================================
        // DELETE AZURE FILES IF DATABASE FAILED
        // =====================================================

        // This is optional for now.
        // Azure uploads are NOT automatically rolled back
        // when MySQL rolls back.

        /*
        for (const fileUrl of uploadedFiles) {
            try {
                await deleteDocument(fileUrl);
            } catch (deleteError) {
                console.error(
                    "Failed to delete Azure file:",
                    deleteError
                );
            }
        }
        */


        // =====================================================
        // RESPONSE STATUS
        // =====================================================

        let statusCode = 500;

        if (
            error.message.includes("already registered")
        ) {

            statusCode = 409;
        }


        return res.status(statusCode).json({
            message: error.message
        });


    } finally {

        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    registerSmme
};