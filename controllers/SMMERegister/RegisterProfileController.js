const authService = require("../../UserService/userService");
const db = require("../../config/database");

const {
    createOtp
} = require("../../UserService/otpService");

const {
    sendOtpEmail
} = require("../../UserService/emailService");


// =====================================================
// CREATE ED TEAM USER
// =====================================================

const createUser = async (req, res) => {

    let connection;

    try {

        // =====================================================
        // GET DATABASE CONNECTION
        // =====================================================

        connection = await db.getConnection();


        // =====================================================
        // GET DATA FROM REQUEST BODY
        // =====================================================

        const {
            title,
            first_name,
            last_name,
            id_number,
            gender,
            phone_number,
            email,
            password
        } = req.body;


        // =====================================================
        // DEFAULT ROLE
        // =====================================================
        // 1 = SMME_TEAM

        const role_id = 1;


        // =====================================================
        // REQUIRED FIELD VALIDATION
        // =====================================================

        if (
            !title ||
            !first_name ||
            !last_name ||
            !id_number ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Title, first name, last name, ID number, email and password are required"
            });
        }


        // =====================================================
        // CREATE USER
        // =====================================================

        const user = await authService.createUser(
            connection,
            {
                role_id,
                title,
                first_name,
                last_name,
                id_number,
                gender,
                phone_number,
                email,
                password
            }
        );


        console.log(
            "ED Team user created:",
            user.user_id
        );


        // =====================================================
        // CREATE OTP
        // =====================================================

        const otp = await createOtp(
            connection,
            user.user_id
        );


        console.log(
            "OTP created for user:",
            user.user_id
        );


        // =====================================================
        // SEND OTP EMAIL
        // =====================================================

        await sendOtpEmail(
            user.email,
            otp
        );


        console.log(
            "OTP email sent to:",
            user.email
        );


        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "ED Team user created successfully. OTP has been sent to the user's email.",

            data: {
                user_id: user.user_id,
                role_id: user.role_id,
                role_name: user.role_name,
                title: user.title,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            }

        });


    } catch (error) {

        console.error(
            "Create ED Team user error:",
            error
        );


        // =====================================================
        // DUPLICATE ID NUMBER
        // =====================================================

        if (
            error.message ===
            "ID number is already registered"
        ) {

            return res.status(409).json({
                success: false,
                message: error.message
            });
        }


        // =====================================================
        // DUPLICATE EMAIL
        // =====================================================

        if (
            error.message ===
            "Email is already registered"
        ) {

            return res.status(409).json({
                success: false,
                message: error.message
            });
        }


        // =====================================================
        // INVALID ROLE
        // =====================================================

        if (
            error.message ===
            "Invalid role"
        ) {

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }


        // =====================================================
        // SERVER ERROR
        // =====================================================

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
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
    createUser
};