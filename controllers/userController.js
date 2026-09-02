const db = require("../config/database");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
    try {
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

        // Basic validation
        if (
            !role_id ||
            !first_name ||
            !last_name ||
            !id_number ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        // Check if ID number already exists
        const [existingId] = await db.query(
            "SELECT user_id FROM user WHERE id_number = ?",
            [id_number]
        );

        if (existingId.length > 0) {
            return res.status(409).json({
                message: "ID number is already registered"
            });
        }

        // Check if email already exists
        const [existingEmail] = await db.query(
            "SELECT user_id FROM user WHERE email = ?",
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user
        const sql = `
            INSERT INTO user (
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
                farmer_type,
                password_hash
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
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
            password_hash
        ];

        const [result] = await db.query(sql, values);

        res.status(201).json({
            message: "User registered successfully",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            message: "Failed to register user",
            error: error.message
        });
    }
};

module.exports = {
    createUser
};