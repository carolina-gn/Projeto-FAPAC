const mysql = require("mysql2/promise");
const { MYSQL_PUBLIC_URL } = require("../../config");

const pool = mysql.createPool({
  uri: MYSQL_PUBLIC_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

const originalQuery = pool.query.bind(pool);

pool.query = async (...args) => {
  try {
    return await originalQuery(...args);
  } catch (err) {
    const retryable =
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.code === "EPIPE" ||
      String(err.message || "").includes("Connection lost") ||
      String(err.message || "").includes("server closed the connection");

    if (retryable) {
      console.warn("MySQL connection caiu. A tentar novamente...");
      return await originalQuery(...args);
    }

    throw err;
  }
};

module.exports = pool;