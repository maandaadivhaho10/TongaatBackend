const db = require("../config/database");

const {
    createUser
} = require("../UserService/userService");

const {
    createBusinessProfile
} = require("../UserService/businessProfileService");

const {
    createFarm
} = require("../UserService/farmService");

const {
    createBusinessDocuments
} = require("../UserService/businessDocumentService");

const {
    uploadDocument
} = require("../UserService/azureDocumentService");


const registerFarmer = async (req, res) => {

    let connection;

    try {

        // ============================================
        // DATABASE CONNECTION
        // ============================================

        connection = await db.getConnection();

        await connection.beginTransaction();


        // ============================================
        // CREATE USER
        // ============================================
        console.log("REQ BODY:", req.body);
console.log("PASSWORD:", req.body.password);

        const user = await createUser(
            connection,
            req.body
        );


        // ============================================
        // CHECK FARMER ROLE
        // ============================================

        if (
            user.role_name.toUpperCase() !== "FARMER"
        ) {
            throw new Error(
                "This endpoint is only for farmers"
            );
        }


        // ============================================
        // CREATE BUSINESS PROFILE
        // ============================================
          // Parse business profile
        const businessProfile =
            JSON.parse(req.body.business_profile);

         // Create business profile
        const businessId =
            await createBusinessProfile(
                connection,
                user.user_id,
                businessProfile
            );


        // ============================================
        // UPLOAD DOCUMENTS TO AZURE
        // ============================================

        const uploadedDocuments = [];

        if (req.files && req.files.length > 0) {

            if (req.files.length !== 3) {
                throw new Error(
                    "Exactly 3 documents are required"
                );
            }

            for (const file of req.files) {

                const uploaded =
                    await uploadDocument(
                        file,
                        businessId
                    );

                uploadedDocuments.push({
                    document_type:
                        file.fieldname,

                    document_name:
                        uploaded.document_name,

                    document_path:
                        uploaded.document_path
                });
            }
        }


        // ============================================
        // SAVE DOCUMENT RECORDS
        // ============================================
        

        await createBusinessDocuments(
            connection,
            businessId,
            uploadedDocuments
        );


        // ============================================
        // CREATE FARM
        // ============================================
       // Parse farm
        const farm =
            JSON.parse(req.body.farm);

        // Create farm
        const farmId =
            await createFarm(
                connection,
                user.user_id,
                farm
            );


        // ============================================
        // COMMIT TRANSACTION
        // ============================================

        await connection.commit();


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(201).json({

            message:
                "Farmer registered successfully",

            data: {
                user_id: user.user_id,
                business_id: businessId,
                farm_id: farmId,

                documents:
                    uploadedDocuments
            }

        });

    } catch (error) {

        // ============================================
        // ROLLBACK
        // ============================================

        if (connection) {
            await connection.rollback();
        }

        console.error(
            "Farmer registration error:",
            error
        );

        let statusCode = 500;

        if (
            error.message.includes(
                "already registered"
            )
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
    registerFarmer
};