const authService = require("../../UserService/userService");
const db = require("../../config/database");
const { createOtp } = require("../../UserService/otpService");
const { sendOtpEmail } = require("../../UserService/emailService");
const { validateSAID } = require("../../utils/validateSAID");

// 1 = SMME_TEAM
const DEFAULT_ROLE_ID = 1;

// Errors thrown by userService that map to a specific HTTP response
const KNOWN_ERRORS = {
    "ID number is already registered": 409,
    "Email is already registered": 409,
    "Invalid role": 400
};

const createUser = async (req, res) => {

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

    // -------------------------------------------------
    // VALIDATE FIRST (no DB connection needed yet)
    // -------------------------------------------------

    if (!title || !first_name || !last_name || !id_number || !email || !password) {
        return res.status(400).json({
            success: false,
            message:
                "Title, first name, last name, ID number, email and password are required"
        });
    }

    const idValidation = validateSAID(id_number);

    if (!idValidation.valid) {
        return res.status(400).json({
            success: false,
            message: idValidation.message
        });
    }

    // -------------------------------------------------
    // CREATE USER + OTP + EMAIL IN ONE TRANSACTION
    // -------------------------------------------------

    let connection;

    try {

        connection = await db.getConnection();
        await connection.beginTransaction();

        const user = await authService.createUser(connection, {
            role_id: DEFAULT_ROLE_ID,
            title,
            first_name,
            last_name,
            id_number,
            gender,
            phone_number,
            email,
            password
        });

        const otp = await createOtp(connection, user.user_id);

        // Send BEFORE commit: if the email fails, the user is rolled back
        // and can simply retry registration.
        await sendOtpEmail(user.email, otp);

        await connection.commit();

        console.log("ED Team user created:", user.user_id);

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

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        console.error("Create ED Team user error:", error);

        // Known business errors
        const status = KNOWN_ERRORS[error.message];
        if (status) {
            return res.status(status).json({
                success: false,
                message: error.message
            });
        }

        // Race condition: two requests passed the duplicate check at once,
        // the DB unique index caught the second one.
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "ID number or email is already registered"
            });
        }

        // Never expose internal error details to the client
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

module.exports = { createUser };