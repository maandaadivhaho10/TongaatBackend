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



const registerSmme = async (req, res) => {

    let connection;


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
        // CREATE BUSINESS PROFILE
        // =====================================================

        const businessId =
            await createBusinessProfile(
                connection,
                user.user_id,
                req.body.business_profile
            );
            //create bissness document

            await createBusinessDocuments(
    connection,
    businessId,
    req.body.business_documents
);


        // =====================================================
        // VALIDATE MATURITY
        // =====================================================

        if (!req.body.business_maturity) {

            throw new Error(
                "Business maturity information is required"
            );
        }


        // =====================================================
        // CREATE BUSINESS MATURITY
        // =====================================================

        const maturityId =
            await createBusinessMaturity(
                connection,
                businessId,
                req.body.business_maturity
            );


        // =====================================================
        // CREATE CLIENT REFERENCES
        // =====================================================

        await createClientReferences(
            connection,
            maturityId,
            req.body.client_references
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
        // ROLLBACK EVERYTHING
        // =====================================================

        if (connection) {
            await connection.rollback();
        }


        console.error(
            "SMME registration error:",
            error
        );


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