
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =====================================================
// LOGIN USER SERVICE
// =====================================================

const loginUser = async (connection, email, password) => {

    // =====================================================
    // 1. FIND USER BY EMAIL
    // =====================================================

    const [users] = await connection.execute(
        `SELECT
            user_id,
            id_number,
            first_name,
            last_name,
            email,
            phone_number,
            gender,
            role_id,
            password_hash
         FROM user
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    // =====================================================
    // 2. CHECK IF USER EXISTS
    // =====================================================

    if (users.length === 0) {
        throw new Error("Invalid email or password");
    }

    const user = users[0];

    // =====================================================
    // 3. VERIFY PASSWORD
    // =====================================================

    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    // =====================================================
    // 4. GENERATE JWT TOKEN
    // =====================================================

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
        {
            user_id: user.user_id,
            role_id: user.role_id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    // =====================================================
    // 5. PREPARE USER DETAILS
    // EXCLUDE PASSWORD AND PASSWORD HASH
    // =====================================================

    const userData = {
        user_id: user.user_id,
        id_number: user.id_number,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        gender: user.gender,
        role_id: user.role_id
    };

    // =====================================================
    // 6. RETURN USER DETAILS AND TOKEN
    // =====================================================

    return {
        user: userData,
        token
    };
};

module.exports = {
    loginUser
};
