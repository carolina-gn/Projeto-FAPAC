const Alert = require("../models/alert");
const SensorReading = require("../models/sensorReading");
const { sendPushToAllUsers } = require("./pushService");

const CO2_LIMITE = 1000;
const HUMIDADE_LIMITE = 70;
const VIBRACAO_LIMITE = 3;

const TEMP_MIN_CONFORTO = 18;
const TEMP_MAX_CONFORTO = 26;

const HORA_FECHO_INICIO = 22;
const HORA_FECHO_FIM = 7;

const POTENCIA_NOTURNA_LIMITE = 1000;
const CONSUMO_NOTURNO_LIMITE = 1000;

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getTimestamp(row) {
  return row.timestamp || row.receivedAt || row.createdAt || new Date();
}

function getLocal(row) {
  return row.sala || row.local || row.equipamento || row.circuito || "Geral";
}

function isRoomEmpty(value) {
  const v = normalize(value);
  const n = Number(value);

  return (
    n === 0 ||
    v === "livre" ||
    v === "false" ||
    v === "vazio" ||
    v === "desocupado"
  );
}

function isLightOn(row) {
  const iluminacao = Number(row.iluminacao);
  const ligado = Number(row.ligado);
  const v = normalize(row.iluminacao ?? row.ligado);

  return (
    iluminacao === 1 ||
    ligado === 1 ||
    v === "1" ||
    v === "true" ||
    v === "ligada" ||
    v === "ligado"
  );
}

function isHvacOn(row) {
  const ativo = Number(row.ativo);
  const v = normalize(row.hvac ?? row.ativo);

  return (
    ativo === 1 ||
    v === "1" ||
    v === "true" ||
    v === "ligado" ||
    v === "ativa" ||
    v === "ativo"
  );
}

function isOutsideClosedHours(row) {
  const date = new Date(getTimestamp(row));
  if (Number.isNaN(date.getTime())) return false;

  const hour = date.getHours();
  return hour >= HORA_FECHO_INICIO || hour < HORA_FECHO_FIM;
}

function buildTriggerData(row) {
  return {
    tipo: row.tipo || "",
    sub_tipo: row.sub_tipo || "",

    ocupacao: toNumber(row.ocupacao),
    iluminacao: toNumber(row.iluminacao),
    hvac: row.hvac || "",

    co2: toNumber(row.co2),
    temperatura: toNumber(row.temperatura),

    consumo: toNumber(row.consumo),
    potencia: toNumber(row.potencia),

    humidade: toNumber(row.humidade),
    estado: row.estado || "",

    vibracao: toNumber(row.vibracao),
    alerta: row.alerta || "",

    local: row.local || "",
    circuito: row.circuito || "",
    equipamento: row.equipamento || ""
  };
}

async function createOrUpdateAlert(row, config) {
  const local = getLocal(row);

  const existing = await Alert.findOne({
    ruleKey: config.ruleKey,
    sala: local,
    status: "ativo"
  });

  const source = {
    table: "sensorreadings",
    rowId: String(row._id),
    timestamp: String(getTimestamp(row))
  };

  const triggerData = buildTriggerData(row);

  if (existing) {
    existing.lastDetectedAt = new Date();
    existing.source = source;
    existing.triggerData = triggerData;
    await existing.save();
    return;
  }

  const createdAlert = await Alert.create({
    ruleKey: config.ruleKey,
    title: config.title,
    message: config.message(row),
    category: config.category,
    severity: config.severity,
    sala: local,
    source,
    triggerData,
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

async function processAmbienteAlerts(row) {
  const temperatura = toNumber(row.temperatura);
  const co2 = toNumber(row.co2);

  if (temperatura !== null && temperatura > 2) {
    await createOrUpdateAlert(row, {
      ruleKey: "test-temperature-above-2",
      title: "Teste temperatura",
      message: () => `${getLocal(row)}: ${temperatura}°C.`,
      category: "ambiente",
      severity: "alta"
    });
  }

  if (co2 !== null && co2 >= CO2_LIMITE) {
    await createOrUpdateAlert(row, {
      ruleKey: "co2-high",
      title: "CO₂ elevado",
      message: () => `${getLocal(row)}: ${co2} ppm.`,
      category: "ambiente",
      severity: "alta"
    });
  }

  if (
    temperatura !== null &&
    (temperatura < TEMP_MIN_CONFORTO || temperatura > TEMP_MAX_CONFORTO)
  ) {
    await createOrUpdateAlert(row, {
      ruleKey: "temperature-out-of-comfort",
      title: "Temperatura fora do ideal",
      message: () => `${getLocal(row)}: ${temperatura}°C.`,
      category: "ambiente",
      severity: "media"
    });
  }

  if (isRoomEmpty(row.ocupacao) && isHvacOn(row)) {
    await createOrUpdateAlert(row, {
      ruleKey: "hvac-empty-room",
      title: "HVAC sem ocupação",
      message: () => `${getLocal(row)}: sistema ligado.`,
      category: "energia",
      severity: "media"
    });
  }

  if (isRoomEmpty(row.ocupacao) && isLightOn(row)) {
    await createOrUpdateAlert(row, {
      ruleKey: "light-empty-room",
      title: "Luz sem ocupação",
      message: () => `${getLocal(row)}: luz ligada.`,
      category: "energia",
      severity: "media"
    });
  }
}

async function processFugaAlerts(row) {
  const estado = normalize(row.estado);
  const humidade = toNumber(row.humidade);

  if (estado && estado !== "normal") {
    await createOrUpdateAlert(row, {
      ruleKey: "leak-detected",
      title: "Fuga detetada",
      message: () => `${getLocal(row)}: estado anormal.`,
      category: "seguranca",
      severity: "critica"
    });
  }

  if (humidade !== null && humidade >= HUMIDADE_LIMITE) {
    await createOrUpdateAlert(row, {
      ruleKey: "humidity-high",
      title: "Humidade elevada",
      message: () => `${getLocal(row)}: ${humidade}%.`,
      category: "ambiente",
      severity: "alta"
    });
  }
}

async function processVibracaoAlerts(row) {
  const vibracao = toNumber(row.vibracao);
  const alerta = normalize(row.alerta);

  const hasAlerta =
    alerta &&
    alerta !== "ok" &&
    alerta !== "0" &&
    alerta !== "normal";

  const hasVibracaoAlta =
    vibracao !== null && vibracao >= VIBRACAO_LIMITE;

  if (!hasAlerta && !hasVibracaoAlta) return;

  await createOrUpdateAlert(row, {
    ruleKey: "possible-hvac-failure",
    title: "Possível avaria AVAC",
    message: () => `${getLocal(row)}: vibração anormal.`,
    category: "seguranca",
    severity: "alta"
  });
}

async function processConsumoAlerts(row) {
  const potencia = toNumber(row.potencia);
  const consumo = toNumber(row.consumo);

  const potenciaAlta =
    potencia !== null && potencia >= POTENCIA_NOTURNA_LIMITE;

  const consumoAlto =
    consumo !== null && consumo >= CONSUMO_NOTURNO_LIMITE;

  if (!isOutsideClosedHours(row)) return;
  if (!potenciaAlta && !consumoAlto) return;

  await createOrUpdateAlert(row, {
    ruleKey: "night-consumption-anomaly",
    title: "Consumo fora de horas",
    message: () => `${getLocal(row)}: pico noturno.`,
    category: "energia",
    severity: "alta"
  });
}

async function checkAmbienteAlerts() {
  const rows = await SensorReading.find({ tipo: "ambiente" })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  for (const row of rows) {
    await processAmbienteAlerts(row);
  }
}

async function checkFugaAlerts() {
  const rows = await SensorReading.find({ tipo: "fuga" })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  for (const row of rows) {
    await processFugaAlerts(row);
  }
}

async function checkVibracaoAlerts() {
  const rows = await SensorReading.find({ tipo: "vibracao" })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  for (const row of rows) {
    await processVibracaoAlerts(row);
  }
}

async function checkConsumoAlerts() {
  const rows = await SensorReading.find({ tipo: "consumo" })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  for (const row of rows) {
    await processConsumoAlerts(row);
  }
}

let isRunning = false;

async function runAlertCheckSafely() {
  if (isRunning) return;
  isRunning = true;

  try {
    await checkAmbienteAlerts();
    await checkFugaAlerts();
    await checkVibracaoAlerts();
    await checkConsumoAlerts();
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