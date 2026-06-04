const express = require("express");
const router = express.Router();
const SensorReading = require("../models/sensorReading");

function toNumber(value, decimals = 2) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? Number(num.toFixed(decimals)) : 0;
}

function avg(rows, field) {
  const values = rows
    .map(r => Number(r[field]))
    .filter(v => Number.isFinite(v));

  if (!values.length) return 0;
  return toNumber(values.reduce((a, b) => a + b, 0) / values.length);
}

function labelTime(row) {
  const date = row.timestamp || row.receivedAt || row.createdAt;
  if (!date) return "";
  return new Date(date).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

router.post("/api/sensors/ingest", async (req, res) => {
  try {
    const data = req.body;

    if (!data.tipo) {
      return res.status(400).json({
        ok: false,
        error: "Campo tipo é obrigatório"
      });
    }

    const created = await SensorReading.create({
      ...data,
      receivedAt: new Date()
    });

    res.json({
      ok: true,
      message: "Dados guardados no MongoDB",
      id: created._id
    });
  } catch (error) {
    console.error("Erro ao guardar sensor:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/api/sensors/test", async (req, res) => {
  try {
    const rows = await SensorReading.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      ok: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/api/sensors/dashboard/ambiente", async (req, res) => {
  try {
    const rows = await SensorReading.find({ tipo: "ambiente" })
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    const chronological = [...rows].reverse();

    const temperaturaMedia = avg(rows, "temperatura");
    const co2Medio = avg(rows, "co2");

    const ocupados = rows.filter(r => Number(r.ocupacao) > 0).length;
    const taxaOcupacao = rows.length ? toNumber((ocupados / rows.length) * 100) : 0;

    const hvacLigado = rows.filter(r => String(r.hvac) === "1" || String(r.hvac).toLowerCase() === "ligado").length;
    const hvacLigadoPercent = rows.length ? toNumber((hvacLigado / rows.length) * 100) : 0;

    const conforto =
      temperaturaMedia >= 20 && temperaturaMedia <= 25
        ? "Confortável"
        : "Desconfortável";

    const hvacGroups = {};
    rows.forEach(r => {
      const key = String(r.hvac ?? "Sem dados");
      if (!hvacGroups[key]) hvacGroups[key] = [];
      hvacGroups[key].push(r);
    });

    const ocupacaoGroups = {};
    rows.forEach(r => {
      const key = String(r.ocupacao ?? "Sem dados");
      if (!ocupacaoGroups[key]) ocupacaoGroups[key] = [];
      ocupacaoGroups[key].push(r);
    });

    res.json({
      ok: true,
      page: "ambiente",
      cards: {
        temperaturaMedia,
        co2Medio,
        taxaOcupacao,
        hvacLigadoPercent,
        conforto
      },
      charts: {
        tempHumidade: {
          labels: chronological.map(labelTime),
          temperatura: chronological.map(r => toNumber(r.temperatura)),
          humidade: chronological.map(r => toNumber(r.humidade))
        },

        tempOcupacao: {
          labels: chronological.map(labelTime),
          temperatura: chronological.map(r => toNumber(r.temperatura)),
          ocupacao: chronological.map(r => toNumber(r.ocupacao))
        },

        co2Ocupacao: {
          labels: chronological.map(labelTime),
          co2: chronological.map(r => toNumber(r.co2)),
          ocupacao: chronological.map(r => toNumber(r.ocupacao))
        },

        hvacTemperaturaTempo: {
          labels: chronological.map(labelTime),
          temperatura: chronological.map(r => toNumber(r.temperatura)),
          hvac: chronological.map(r =>
            String(r.hvac) === "1" || String(r.hvac).toLowerCase() === "ligado" ? 1 : 0
          )
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/api/sensors/dashboard/consumo", async (req, res) => {
  try {
    const rows = await SensorReading.find({ tipo: "consumo" })
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    const chronological = [...rows].reverse();

    const groups = {};
    rows.forEach(r => {
      const key = r.local || r.sala || r.circuito || "Sem local";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const circuitoMedias = Object.entries(groups).map(([nome, group]) => ({
      circuito: nome,
      valor: avg(group, "consumo")
    })).sort((a, b) => b.valor - a.valor);

    res.json({
      ok: true,
      page: "consumo",
      cards: {
        consumoMedio: avg(rows, "consumo"),
        potenciaMedia: avg(rows, "potencia"),
        circuitoPrincipal: circuitoMedias[0]?.circuito || "--"
      },
      charts: {
        consumoTempo: {
          labels: chronological.map(labelTime),
          values: chronological.map(r => toNumber(r.consumo))
        },
        potenciaTempo: {
          labels: chronological.map(labelTime),
          values: chronological.map(r => toNumber(r.potencia))
        },
        consumoCircuito: {
          labels: circuitoMedias.map(r => r.circuito),
          values: circuitoMedias.map(r => toNumber(r.valor))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/api/sensors/dashboard/fuga", async (req, res) => {
  try {
    const rows = await SensorReading.find({ tipo: "fuga" })
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    const chronological = [...rows].reverse();

    const locais = [...new Set(rows.map(r => r.local).filter(Boolean))];

    const alertas = rows.filter(r =>
      String(r.estado || "").toLowerCase() !== "normal"
    ).length;

    const groups = {};
    rows.forEach(r => {
      const key = r.local || "Sem local";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    res.json({
      ok: true,
      cards: {
        humidadeMedia: avg(rows, "humidade"),
        locaisMonitorizados: locais.length,
        fugasDetetadas: alertas
      },
      charts: {
        humidadeTempo: {
          labels: chronological.map(labelTime),
          values: chronological.map(r => toNumber(r.humidade))
        },
        humidadeLocal: {
          labels: Object.keys(groups),
          values: Object.values(groups).map(group => avg(group, "humidade"))
        },
        estadoLocal: {
          labels: Object.keys(groups),
          values: Object.values(groups).map(group =>
            group.filter(r => String(r.estado || "").toLowerCase() !== "normal").length
          )
        }
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get("/api/sensors/dashboard/vibracao", async (req, res) => {
  try {
    const rows = await SensorReading.find({ tipo: "vibracao" })
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    const chronological = [...rows].reverse();

    const groups = {};
    rows.forEach(r => {
      const key = r.equipamento || r.local || "Sem equipamento";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const alertas = rows.filter(r => {
      if (r.alerta !== undefined && r.alerta !== null) {
        return String(r.alerta).toLowerCase() !== "ok" && String(r.alerta) !== "0";
      }
      return Number(r.vibracao) >= 3;
    }).length;

    const estadoCounts = {
      Normal: rows.length - alertas,
      Alerta: alertas
    };

    res.json({
      ok: true,
      cards: {
        vibracaoMedia: avg(rows, "vibracao"),
        equipamentos: Object.keys(groups).length,
        alertas
      },
      charts: {
        vibracaoTempo: {
          labels: chronological.map(labelTime),
          values: chronological.map(r => toNumber(r.vibracao))
        },
        vibracaoEquipamento: {
          labels: Object.keys(groups),
          values: Object.values(groups).map(group => avg(group, "vibracao"))
        },
        estado: {
          labels: Object.keys(estadoCounts),
          values: Object.values(estadoCounts)
        }
      }
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message
    });
  }
});

module.exports = router;