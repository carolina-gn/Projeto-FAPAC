const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');

router.get('/api/sensors/test', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [rows] = await connection.query(`
            SELECT 
                id,
                hora,
                sala,
                ocupacao,
                temperatura,
                co2,
                iluminacao,
                hvac,
                alerta
            FROM ambiente
            ORDER BY id DESC
            LIMIT 10
        `);

        connection.release();

        res.json({
            ok: true,
            total: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
            code: error.code || null,
            errno: error.errno || null
        });
    }
});

module.exports = router;