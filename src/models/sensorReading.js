const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: ["ambiente", "consumo", "fuga", "vibracao"]
    },

    sala: String,
    local: String,
    circuito: String,
    equipamento: String,

    ocupacao: String,
    temperatura: Number,
    co2: Number,
    iluminacao: String,
    hvac: String,

    consumo: Number,
    potencia: Number,

    humidade: Number,
    estado: String,

    vibracao: Number,
    alerta: String,

    receivedAt: {
      type: Date,
      default: Date.now,
      expires: 86400
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SensorReading", sensorReadingSchema);