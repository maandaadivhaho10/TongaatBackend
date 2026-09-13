
const authService = require("../UserService/userService");
const db = require("../config/database");

const createUser = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();

        const {
            role_id,
            first_name,
            last_name,
            id_number,
            gender,
            phone_number,
            email,
            province,
            city,
            address,
            postal_code,
            password
        } = req.body;

        // Basic required-field validation
        if (
            !role_id ||
            !first_name ||
            !last_name ||
            !id_number ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Role, first name, last name, ID number, email and password are required"
            });
        }

        const result = await authService.createUser(
            connection,
            {
                role_id,
                first_name,
                last_name,
                id_number,
                gender,
                phone_number,
                email,
                province,
                city,
                address,
                postal_code,
                password
            }
        );

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: result
        });

    } catch (error) {
        console.error("Create user error:", error);

        if (error.message === "ID number is already registered") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Email is already registered") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Invalid role") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

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

module.exports = {
    createUser
};

