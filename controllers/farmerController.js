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


const registerFarmer = async (req, res) => {

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
        // MAKE SURE ROLE IS FARMER
        // =====================================================

        if (
            user.role_name.toUpperCase() !== "FARMER"
        ) {

            throw new Error(
                "This endpoint is only for farmers"
            );
        }


        // =====================================================
        // CREATE BUSINESS PROFILE
        // =====================================================

        const businessId = await createBusinessProfile(
        connection,
        user.user_id,
        req.body.business_profile
            );

     await createBusinessDocuments(
           connection,
          businessId,
        req.body.business_profile.documents
           );


        // =====================================================
        // CREATE FARM
        // =====================================================

        const farmId =
            await createFarm(
                connection,
                user.user_id,
                req.body.farm
            );




        // =====================================================
        // COMMIT
        // =====================================================

        await connection.commit();


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            message: "Farmer registered successfully",

            data: {
                user_id: user.user_id,
                business_id: businessId,
                farm_id: farmId
            }

        });


    } catch (error) {

        // =====================================================
        // ROLLBACK
        // =====================================================

        if (connection) {
            await connection.rollback();
        }


        console.error(
            "Farmer registration error:",
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
    registerFarmer
};