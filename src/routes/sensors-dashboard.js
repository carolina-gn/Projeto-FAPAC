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
            SELECT hora, co2
            FROM (
                SELECT
                    id,
                    hora,
                    co2
                FROM ambiente
                ORDER BY id DESC
                LIMIT 120
            ) AS ultimos
            ORDER BY id ASC
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
            SELECT hora, temperatura, co2
            FROM (
                SELECT
                    id,
                    hora,
                    temperatura,
                    co2
                FROM ambiente
                ORDER BY id DESC
                LIMIT 120
            ) AS ultimos
            ORDER BY id ASC
        `);

        const [scatterRows] = await pool.query(`
            SELECT hora, temperatura, co2
            FROM (
                SELECT
                    id,
                    hora,
                    temperatura,
                    co2
                FROM ambiente
                ORDER BY id DESC
                LIMIT 120
            ) AS ultimos
            ORDER BY id ASC
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

router.get('/api/sensors/dashboard/consumo', async (req, res) => {
    try {
        const [kpiRows] = await pool.query(`
            SELECT
                AVG(consumo) AS consumo_medio,
                AVG(potencia) AS potencia_media
            FROM consumo
        `);

        const [mainCircuitRow] = await pool.query(`
            SELECT circuito, AVG(consumo) AS media
            FROM consumo
            GROUP BY circuito
            ORDER BY media DESC
            LIMIT 1
        `);

        const [consumoTempoRows] = await pool.query(`
            SELECT hora, consumo
            FROM (
                SELECT id, hora, consumo
                FROM consumo
                ORDER BY id DESC
                LIMIT 120
            ) x
            ORDER BY id ASC
        `);

        const [potenciaTempoRows] = await pool.query(`
            SELECT hora, potencia
            FROM (
                SELECT id, hora, potencia
                FROM consumo
                ORDER BY id DESC
                LIMIT 120
            ) x
            ORDER BY id ASC
        `);

        const [circuitoRows] = await pool.query(`
            SELECT circuito, AVG(consumo) AS valor
            FROM consumo
            GROUP BY circuito
            ORDER BY valor DESC
        `);

        res.json({
            ok: true,
            page: "consumo",
            cards: {
                consumoMedio: toNumber(kpiRows[0]?.consumo_medio),
                potenciaMedia: toNumber(kpiRows[0]?.potencia_media),
                circuitoPrincipal: mainCircuitRow[0]?.circuito || "--"
            },
            charts: {
                consumoTempo: {
                    labels: consumoTempoRows.map(r => r.hora),
                    values: consumoTempoRows.map(r => toNumber(r.consumo))
                },
                potenciaTempo: {
                    labels: potenciaTempoRows.map(r => r.hora),
                    values: potenciaTempoRows.map(r => toNumber(r.potencia))
                },
                consumoCircuito: {
                    labels: circuitoRows.map(r => r.circuito),
                    values: circuitoRows.map(r => toNumber(r.valor))
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

router.get('/api/sensors/dashboard/fuga', async (req, res) => {
  try {
    const [kpi] = await pool.query(`
      SELECT AVG(humidade) media,
             COUNT(DISTINCT local) locais,
             SUM(CASE WHEN estado <> 'normal' THEN 1 ELSE 0 END) alertas
      FROM fuga
    `);

    const [tempo] = await pool.query(`
      SELECT hora, humidade
      FROM (
        SELECT id,hora,humidade FROM fuga ORDER BY id DESC LIMIT 100
      ) x ORDER BY id ASC
    `);

    const [local] = await pool.query(`
      SELECT local, AVG(humidade) valor
      FROM fuga
      GROUP BY local
    `);

    const [estado] = await pool.query(`
      SELECT local, SUM(CASE WHEN estado <> 'normal' THEN 1 ELSE 0 END) valor
      FROM fuga
      GROUP BY local
    `);

    res.json({
      ok: true,
      cards: {
        humidadeMedia: toNumber(kpi[0].media),
        locaisMonitorizados: kpi[0].locais,
        fugasDetetadas: kpi[0].alertas
      },
      charts: {
        humidadeTempo: {
          labels: tempo.map(r => r.hora),
          values: tempo.map(r => toNumber(r.humidade))
        },
        humidadeLocal: {
          labels: local.map(r => r.local),
          values: local.map(r => toNumber(r.valor))
        },
        estadoLocal: {
          labels: estado.map(r => r.local),
          values: estado.map(r => toNumber(r.valor))
        }
      }
    });

  } catch (e) {
    res.status(500).json({ ok:false,error:e.message });
  }
});

router.get('/api/sensors/dashboard/vibracao', async (req, res) => {
  try {
    const [kpi] = await pool.query(`
      SELECT AVG(vibracao) media,
             COUNT(DISTINCT equipamento) eqs,
             SUM(CASE WHEN estado <> 'normal' THEN 1 ELSE 0 END) alertas
      FROM vibracao
    `);

    const [tempo] = await pool.query(`
      SELECT hora, vibracao
      FROM (
        SELECT id,hora,vibracao FROM vibracao ORDER BY id DESC LIMIT 100
      ) x ORDER BY id ASC
    `);

    const [equip] = await pool.query(`
      SELECT equipamento, AVG(vibracao) valor
      FROM vibracao
      GROUP BY equipamento
    `);

    const [estado] = await pool.query(`
      SELECT equipamento, SUM(CASE WHEN estado <> 'normal' THEN 1 ELSE 0 END) valor
      FROM vibracao
      GROUP BY equipamento
    `);

    res.json({
      ok: true,
      cards: {
        vibracaoMedia: toNumber(kpi[0].media),
        equipamentos: kpi[0].eqs,
        alertas: kpi[0].alertas
      },
      charts: {
        vibracaoTempo: {
          labels: tempo.map(r => r.hora),
          values: tempo.map(r => toNumber(r.vibracao))
        },
        vibracaoEquipamento: {
          labels: equip.map(r => r.equipamento),
          values: equip.map(r => toNumber(r.valor))
        },
        estado: {
          labels: estado.map(r => r.equipamento),
          values: estado.map(r => toNumber(r.valor))
        }
      }
    });

  } catch (e) {
    res.status(500).json({ ok:false,error:e.message });
  }
});

module.exports = router;