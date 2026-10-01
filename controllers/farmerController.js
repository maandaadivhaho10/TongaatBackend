const db = require("../config/database");

const {
    createOtp
} = require("../UserService/otpService");

const {
    sendOtpEmail
} = require("../UserService/emailService");

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
        // PARSE USER PROFILE
        // ============================================

        const userProfile =
            JSON.parse(req.body.user);


        // ============================================
        // CREATE USER
        // ============================================

        const user = await createUser(
            connection,
            userProfile
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
        // PARSE BUSINESS PROFILE
        // ============================================

        const businessProfile =
            JSON.parse(req.body.business_profile);


        // ============================================
        // CREATE BUSINESS PROFILE
        // ============================================

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

        if (!req.files || req.files.length !== 3) {

            throw new Error(
                "Exactly 3 documents are required"
            );
        }


        const uploadedResults = await Promise.all(

            req.files.map(async (file) => {

                console.log(
                    `Uploading document: ${file.originalname}`
                );

                const uploaded =
                    await uploadDocument(
                        file,
                        businessId
                    );

                console.log(
                    `Uploaded successfully: ${file.originalname}`
                );

                return {

                    document_type:
                        file.fieldname,

                    document_name:
                        uploaded.document_name,

                    document_path:
                        uploaded.document_path
                };
            })
        );


        uploadedDocuments.push(
            ...uploadedResults
        );


        // ============================================
        // SAVE DOCUMENT RECORDS
        // ============================================

        await createBusinessDocuments(
            connection,
            businessId,
            uploadedDocuments
        );


        // ============================================
        // PARSE FARM
        // ============================================

        const farm =
            JSON.parse(req.body.farm);


        // ============================================
        // CREATE FARM
        // ============================================

        const farmId =
            await createFarm(
                connection,
                user.user_id,
                farm
            );


        // ============================================
        // COMMIT REGISTRATION
        // ============================================

        await connection.commit();

        console.log(
            "Farmer registration transaction committed"
        );


        // ============================================
        // RELEASE REGISTRATION CONNECTION
        // ============================================

        connection.release();
        connection = null;


        // ============================================
        // CREATE OTP
        // ============================================

        let otpConnection;

        try {

            otpConnection =
                await db.getConnection();

            const otp =
                await createOtp(
                    otpConnection,
                    user.user_id
                );


            // ========================================
            // SEND OTP EMAIL
            // ========================================

            await sendOtpEmail(
                user.email,
                otp
            );


            console.log(
                `OTP sent to ${user.email}`
            );

        } finally {

            if (otpConnection) {
                otpConnection.release();
            }
        }


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(201).json({

            message:
                "Farmer registered successfully. OTP sent to your email.",

            data: {

                user_id:
                    user.user_id,

                business_id:
                    businessId,

                farm_id:
                    farmId,

                documents:
                    uploadedDocuments
            }
        });


    } catch (error) {


        // ============================================
        // ROLLBACK
        // ============================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }

            connection.release();
            connection = null;
        }


        console.error(
            "Farmer registration error:",
            error
        );


        // ============================================
        // ERROR STATUS
        // ============================================

        let statusCode = 500;


        if (
            error.message &&
            error.message.includes(
                "already registered"
            )
        ) {

            statusCode = 409;
        }


        return res.status(statusCode).json({

            message:
                error.message ||
                "Farmer registration failed"
        });
    }
};


module.exports = {
    registerFarmer
};