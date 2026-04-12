const pool = require("../db/mysql");
const Alert = require("../models/alert");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

async function processRoomEmptyLightsOn(row) {
  const salaLivre = normalize(row.ocupacao) === "livre";
  const luzLigada = normalize(row.iluminacao) === "ligada";

  if (!salaLivre || !luzLigada) {
    return;
  }

  const existing = await Alert.findOne({
    ruleKey: "room-empty-lights-on",
    sala: row.sala,
    status: "ativo"
  });

  if (existing) {
    existing.lastDetectedAt = new Date();
    existing.source = {
      table: "ambiente",
      rowId: row.id,
      timestamp: row.hora
    };
    existing.triggerData = {
      ocupacao: row.ocupacao,
      iluminacao: row.iluminacao,
      hvac: row.hvac,
      co2: Number(row.co2 ?? 0),
      temperatura: Number(row.temperatura ?? 0)
    };
    await existing.save();
    return;
  }

  await Alert.create({
    ruleKey: "room-empty-lights-on",
    title: "Luzes ligadas com sala desocupada",
    message: `A sala ${row.sala} está sem ocupação e com iluminação ligada.`,
    category: "energia",
    severity: "media",
    sala: row.sala,
    source: {
      table: "ambiente",
      rowId: row.id,
      timestamp: row.hora
    },
    triggerData: {
      ocupacao: row.ocupacao,
      iluminacao: row.iluminacao,
      hvac: row.hvac,
      co2: Number(row.co2 ?? 0),
      temperatura: Number(row.temperatura ?? 0)
    },
    status: "ativo",
    firstDetectedAt: new Date(),
    lastDetectedAt: new Date()
  });
}

async function checkAmbienteAlerts() {
  const [rows] = await pool.query(`
    SELECT id, hora, sala, ocupacao, temperatura, co2, iluminacao, hvac, alerta
    FROM ambiente
    ORDER BY id DESC
    LIMIT 30
  `);

  for (const row of rows) {
    await processRoomEmptyLightsOn(row);
  }
}

let isRunning = false;

async function runAlertCheckSafely() {
  if (isRunning) return;
  isRunning = true;

  try {
    await checkAmbienteAlerts();
  } catch (error) {
    console.error("Erro no alert engine:", error.message);
  } finally {
    isRunning = false;
  }
}

function startAlertEngine() {
  runAlertCheckSafely();
  setInterval(runAlertCheckSafely, 60 * 1000);
}

module.exports = {
  startAlertEngine,
  runAlertCheckSafely
};