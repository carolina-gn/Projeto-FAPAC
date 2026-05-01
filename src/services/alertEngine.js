const Alert = require("../models/alert");
const SensorReading = require("../models/sensorReading");
const { sendPushToAllUsers } = require("./pushService");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isRoomEmpty(value) {
  const v = normalize(value);
  return v === "livre" || v === "0" || v === "false" || v === "vazio";
}

function isLightOn(value) {
  const v = normalize(value);
  return v === "ligada" || v === "ligado" || v === "1" || v === "true";
}

async function processRoomEmptyLightsOn(row) {
  const salaLivre = isRoomEmpty(row.ocupacao);
  const luzLigada = isLightOn(row.iluminacao);

  if (!salaLivre || !luzLigada) return;

  const existing = await Alert.findOne({
    ruleKey: "room-empty-lights-on",
    sala: row.sala,
    status: "ativo"
  });

  if (existing) {
    existing.lastDetectedAt = new Date();
    existing.source = {
      table: "sensorreadings",
      rowId: row._id,
      timestamp: row.timestamp || row.createdAt
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

  const createdAlert = await Alert.create({
    ruleKey: "room-empty-lights-on",
    title: "Luzes ligadas com sala desocupada",
    message: `A sala ${row.sala} está sem ocupação e com iluminação ligada.`,
    category: "energia",
    severity: "media",
    sala: row.sala,
    source: {
      table: "sensorreadings",
      rowId: row._id,
      timestamp: row.timestamp || row.createdAt
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

  await sendPushToAllUsers({
    title: createdAlert.title,
    body: createdAlert.message,
    url: "/",
    tag: `alert-${createdAlert._id}`,
    alertId: String(createdAlert._id)
  });
}

async function processTemperatureAboveTwoTest(row) {
  const temperatura = Number(row.temperatura);

  if (Number.isNaN(temperatura) || temperatura <= 2) return;

  const existing = await Alert.findOne({
    ruleKey: "test-temperature-above-2",
    sala: row.sala,
    status: "ativo"
  });

  if (existing) {
    existing.lastDetectedAt = new Date();
    existing.source = {
      table: "sensorreadings",
      rowId: row._id,
      timestamp: row.timestamp || row.createdAt
    };
    existing.triggerData = {
      ocupacao: row.ocupacao,
      iluminacao: row.iluminacao,
      hvac: row.hvac,
      co2: Number(row.co2 ?? 0),
      temperatura
    };
    await existing.save();
    return;
  }

  const createdAlert = await Alert.create({
    ruleKey: "test-temperature-above-2",
    title: "Teste de alerta: temperatura acima de 2°C",
    message: `Teste: a sala ${row.sala} registou ${temperatura}°C.`,
    category: "ambiente",
    severity: "alta",
    sala: row.sala,
    source: {
      table: "sensorreadings",
      rowId: row._id,
      timestamp: row.timestamp || row.createdAt
    },
    triggerData: {
      ocupacao: row.ocupacao,
      iluminacao: row.iluminacao,
      hvac: row.hvac,
      co2: Number(row.co2 ?? 0),
      temperatura
    },
    status: "ativo",
    firstDetectedAt: new Date(),
    lastDetectedAt: new Date()
  });

  await sendPushToAllUsers({
    title: createdAlert.title,
    body: createdAlert.message,
    url: "/",
    tag: `alert-${createdAlert._id}`,
    alertId: String(createdAlert._id)
  });
}

async function checkAmbienteAlerts() {
  const rows = await SensorReading.find({ tipo: "ambiente" })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  for (const row of rows) {
    await processRoomEmptyLightsOn(row);
    await processTemperatureAboveTwoTest(row);
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