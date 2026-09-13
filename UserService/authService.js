const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = async (connection, email, password) => {
    // Find user by email
    const [users] = await connection.execute(
        `SELECT 
            user_id,
            first_name,
            last_name,
            email,
            password_hash,
            role_id
         FROM user
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    // User doesn't exist
    if (users.length === 0) {
        throw new Error("Invalid email or password");
    }

    const user = users[0];

    // Compare entered password with hashed password
    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    // Create JWT token
     const token = jwt.sign(
    {
        user_id: user.id,
        role_id: user.role_id
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1h"
    }
);

    // Don't send password back
    delete user.password;

    return {
        user,
        token
    };
};

module.exports = {
    loginUser
};