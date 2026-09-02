const bcrypt = require("bcrypt");


const createUser = async (connection, userData) => {

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
    } = userData;


    // =====================================================
    // CHECK ID NUMBER
    // =====================================================

    const [existingId] = await connection.query(
        `
        SELECT user_id
        FROM user
        WHERE id_number = ?
        `,
        [id_number]
    );


    if (existingId.length > 0) {
        throw new Error("ID number is already registered");
    }


    // =====================================================
    // CHECK EMAIL
    // =====================================================

    const [existingEmail] = await connection.query(
        `
        SELECT user_id
        FROM user
        WHERE email = ?
        `,
        [email]
    );


    if (existingEmail.length > 0) {
        throw new Error("Email is already registered");
    }


    // =====================================================
    // CHECK ROLE
    // =====================================================

    const [roles] = await connection.query(
        `
        SELECT role_id, role_name
        FROM role
        WHERE role_id = ?
        `,
        [role_id]
    );


    if (roles.length === 0) {
        throw new Error("Invalid role");
    }


    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const password_hash = await bcrypt.hash(password, 10);


    // =====================================================
    // INSERT USER
    // =====================================================

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
            password_hash
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        role_id,
        first_name,
        last_name,
        id_number,
        gender || null,
        phone_number || null,
        email,
        province || null,
        city || null,
        address || null,
        postal_code || null,
        password_hash
    ];


    const [result] = await connection.query(
        sql,
        values
    );


    return {
        user_id: result.insertId,
        role_name: roles[0].role_name
    };
};


module.exports = {
    createUser
};