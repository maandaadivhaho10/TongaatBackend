const mysql = require("mysql2/promise");
require("dotenv").config();

const testPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "tongaat_test",
    port: process.env.DB_PORT || 3306
});

module.exports = testPool;