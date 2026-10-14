const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();


// =====================================================
// CREATE USER
// =====================================================

const createUser = async (connection, userData) => {

    const {
        role_id,
        title,
        first_name,
        last_name,
        id_number,
        gender,
        phone_number,
        email,
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

    console.log("role_id received:", role_id);

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

    const password_hash = await bcrypt.hash(
        password,
        10
    );


    // =====================================================
    // INSERT USER
    // =====================================================

    const sql = `
        INSERT INTO user (
            role_id,
            title,
            first_name,
            last_name,
            id_number,
            gender,
            phone_number,
            email,
            password_hash
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        role_id,
        title,
        first_name,
        last_name,
        id_number,
        gender || null,
        phone_number || null,
        email,
        password_hash
    ];


    const [result] = await connection.query(
        sql,
        values
    );


    // =====================================================
    // RETURN CREATED USER
    // =====================================================

    return {
        user_id: result.insertId,
        role_id: role_id,
        role_name: roles[0].role_name,
        title: title,
        first_name: first_name,
        last_name: last_name,
        email: email
    };
};


module.exports = {
    createUser
};