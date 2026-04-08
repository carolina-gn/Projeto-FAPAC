const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');

function toNumber(value, decimals = 2) {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? Number(num.toFixed(decimals)) : 0;
}

router.get('/api/sensors/test', async (req, res) => {
    try {
        const [rows] = await pool.query(`
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

router.get('/api/sensors/dashboard/ambiente', async (req, res) => {
    try {
        const [kpiRows] = await pool.query(`
            SELECT
                AVG(temperatura) AS temperatura_media,
                AVG(co2) AS co2_medio,
                (
                    SUM(CASE WHEN LOWER(ocupacao) <> 'livre' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
                ) * 100 AS taxa_ocupacao,
                (
                    SUM(CASE WHEN LOWER(hvac) = 'ligado' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
                ) * 100 AS hvac_ligado_percent
            FROM ambiente
        `);

        const [co2TimeRows] = await pool.query(`
            SELECT
                hora,
                AVG(co2) AS co2
            FROM ambiente
            GROUP BY hora
            ORDER BY hora
            LIMIT 120
        `);

        const [hvacTempRows] = await pool.query(`
            SELECT
                hvac,
                AVG(temperatura) AS temperatura_media
            FROM ambiente
            GROUP BY hvac
            ORDER BY hvac
        `);

        const [ocupacaoHvacRows] = await pool.query(`
            SELECT
                ocupacao,
                (
                    SUM(CASE WHEN LOWER(hvac) = 'ligado' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
                ) * 100 AS hvac_ligado_percent
            FROM ambiente
            GROUP BY ocupacao
            ORDER BY ocupacao
        `);

        const [temporalRows] = await pool.query(`
            SELECT
                hora,
                AVG(temperatura) AS temperatura,
                AVG(co2) AS co2
            FROM ambiente
            GROUP BY hora
            ORDER BY hora
            LIMIT 120
        `);

        const [scatterRows] = await pool.query(`
            SELECT
                hora,
                temperatura,
                co2
            FROM ambiente
            ORDER BY hora
            LIMIT 120
        `);

        const kpis = kpiRows[0] || {};
        const temperaturaMedia = toNumber(kpis.temperatura_media);
        const co2Medio = toNumber(kpis.co2_medio);
        const taxaOcupacao = toNumber(kpis.taxa_ocupacao);
        const hvacLigadoPercent = toNumber(kpis.hvac_ligado_percent);

        const conforto =
            temperaturaMedia >= 20 && temperaturaMedia <= 25
                ? 'Confortável'
                : 'Desconfortável';

        res.json({
            ok: true,
            page: 'ambiente',
            cards: {
                temperaturaMedia,
                co2Medio,
                taxaOcupacao,
                hvacLigadoPercent,
                conforto
            },
            charts: {
                co2Tempo: {
                    labels: co2TimeRows.map(row => row.hora),
                    values: co2TimeRows.map(row => toNumber(row.co2))
                },
                hvacImpactoTemperatura: {
                    labels: hvacTempRows.map(row => row.hvac),
                    values: hvacTempRows.map(row => toNumber(row.temperatura_media))
                },
                ocupacaoVsHvac: {
                    labels: ocupacaoHvacRows.map(row => row.ocupacao),
                    values: ocupacaoHvacRows.map(row => toNumber(row.hvac_ligado_percent))
                },
                variaveisTempo: {
                    labels: temporalRows.map(row => row.hora),
                    temperatura: temporalRows.map(row => toNumber(row.temperatura)),
                    co2: temporalRows.map(row => toNumber(row.co2))
                },
                scatterTempCo2: scatterRows.map(row => ({
                    x: toNumber(row.temperatura),
                    y: toNumber(row.co2),
                    hora: row.hora
                }))
            }
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