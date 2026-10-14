const db = require("../../config/database");

const {
    createBusinessProfile
} = require("../../UserService/businessProfileService");

const {
    createBusinessMaturity
} = require("../../UserService/businessMaturityService");

const {
    createClientReferences
} = require("../../UserService/clientReferenceService");

const {
    createBusinessDocuments
} = require("../../UserService/businessDocumentService");

const {
    uploadDocument
} = require("../../UserService/azureDocumentService");

const {
    CompanyRegistrationEmail
} = require("../../UserService/CompanyRegistrationEmail");


// =====================================================
// REGISTER SMME COMPANY
// User must already be logged in.
// user_id comes from JWT token.
// =====================================================

const registerSmme = async (req, res) => {

    let connection;

    // Keep uploaded Azure files in case you later
    // want to implement cleanup after a failed transaction.
    const uploadedFiles = [];

    try {

        // =====================================================
        // GET USER ID FROM JWT TOKEN
        // =====================================================

        const userId = req.user?.user_id;

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized. User ID not found in token."
            });
        }

        console.log("Authenticated user ID:", userId);


        // =====================================================
        // GET DATABASE CONNECTION
        // =====================================================

        connection = await db.getConnection();


        // =====================================================
        // GET EXISTING USER
        // =====================================================

        const [users] = await connection.execute(
            `
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.role_id,
                r.role_name
            FROM user u
            INNER JOIN role r
                ON u.role_id = r.role_id
            WHERE u.user_id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }


        const user = users[0];

        console.log("Authenticated user:", {
            user_id: user.user_id,
            email: user.email,
            role: user.role_name
        });


        // =====================================================
        // MAKE SURE USER IS SMME
        // =====================================================

        if (
            !user.role_name ||
            user.role_name.toUpperCase() !== "SMME"
        ) {

            return res.status(403).json({
                success: false,
                message: "This endpoint is only for SMMEs."
            });
        }


        // =====================================================
        // CHECK IF USER ALREADY REGISTERED A BUSINESS
        // =====================================================

        const [existingBusiness] = await connection.execute(
            `
            SELECT business_id
            FROM business_profile
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (existingBusiness.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "You already have a registered business profile."
            });
        }


        // =====================================================
        // START TRANSACTION
        // =====================================================

        await connection.beginTransaction();


        // =====================================================
        // VALIDATE BUSINESS PROFILE
        // =====================================================

        if (!req.body.business_profile) {

            throw new Error(
                "Business profile information is required"
            );
        }


        let businessProfile;

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
        // USING USER ID FROM TOKEN
        // =====================================================

        const businessId =
            await createBusinessProfile(
                connection,
                userId,
                businessProfile
            );


        console.log(
            "Business profile created:",
            businessId
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


            documents.push({

                document_type:
                    file.fieldname,

                document_name:
                    uploadedDocument.document_name,

                document_path:
                    uploadedDocument.document_path
            });


            uploadedFiles.push(
                uploadedDocument.document_path
            );
        }


        // =====================================================
        // SAVE DOCUMENTS IN DATABASE
        // =====================================================

        await createBusinessDocuments(
            connection,
            businessId,
            documents
        );


        // =====================================================
        // VALIDATE BUSINESS MATURITY
        // =====================================================

        if (!req.body.business_maturity) {

            throw new Error(
                "Business maturity information is required"
            );
        }


        let businessMaturity;


        try {

            businessMaturity =
                typeof req.body.business_maturity === "string"
                    ? JSON.parse(
                        req.body.business_maturity
                    )
                    : req.body.business_maturity;

        } catch (error) {

            throw new Error(
                "Invalid business_maturity JSON"
            );
        }

// =====================================================
// VALIDATE SECTOR ID
// =====================================================

if (!businessMaturity) {
    throw new Error(
        "Business maturity information is required"
    );
}

if (!businessMaturity.sector_id) {
    throw new Error(
        "Sector ID is required"
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
        // CLIENT REFERENCES
        // =====================================================

        let clientReferences = [];


        if (req.body.client_references) {

            try {

                clientReferences =
                    typeof req.body.client_references === "string"
                        ? JSON.parse(
                            req.body.client_references
                        )
                        : req.body.client_references;

            } catch (error) {

                throw new Error(
                    "Invalid client_references JSON"
                );
            }
        }


        // Make sure client references is an array
        if (!Array.isArray(clientReferences)) {

            throw new Error(
                "client_references must be an array"
            );
        }


        // =====================================================
        // CREATE CLIENT REFERENCES
        // =====================================================

        if (clientReferences.length > 0) {

            await createClientReferences(
                connection,
                maturityId,
                clientReferences
            );
        }


        // =====================================================
        // COMMIT DATABASE TRANSACTION
        // =====================================================

        await connection.commit();


        console.log(
            `SMME registration completed for user ${userId}`
        );


        // =====================================================
        // SEND COMPANY REGISTRATION EMAIL
        // IMPORTANT:
        // This happens AFTER commit.
        // There is NO OTP.
        // =====================================================

        try {

            await CompanyRegistrationEmail(
                user.email,
            );


            console.log(
                `Company registration email sent to ${user.email}`
            );

        } catch (emailError) {

            // Do not rollback the company registration.
            // The database registration has already succeeded.

            console.error(
                "Company registered successfully, but registration email failed:",
                emailError
            );
        }


        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Company registered successfully.",

            data: {

                user_id: userId,

                business_id:
                    businessId,

                maturity_id:
                    maturityId,

                business_name:
                    businessProfile.business_name,

                email:
                    user.email
            }
        });


    } catch (error) {

        // =====================================================
        // ROLLBACK
        // =====================================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }
        }


        console.error(
            "SMME registration error:",
            error
        );


        // =====================================================
        // STATUS CODE
        // =====================================================

        let statusCode = 500;


        if (
            error.message?.includes(
                "already registered"
            )
        ) {

            statusCode = 409;

        } else if (
            error.message?.includes("required") ||
            error.message?.includes("Invalid") ||
            error.message?.includes("must be")
        ) {

            statusCode = 400;
        }


        return res.status(statusCode).json({

            success: false,

            message:
                error.message ||
                "Company registration failed."
        });


    } finally {

        // =====================================================
        // RELEASE DATABASE CONNECTION
        // =====================================================

        if (connection) {

            connection.release();
        }
    }
};


module.exports = {
    registerSmme
};