const mysql = require('mysql2/promise');
const { MYSQL_PUBLIC_URL } = require('../../config');

const pool = mysql.createPool({
    uri: MYSQL_PUBLIC_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;