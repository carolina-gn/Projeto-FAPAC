const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: ["ambiente", "consumo", "fuga", "vibracao"]
    },

    sub_tipo: String, // iluminação / avac

    sala: String,
    local: String,
    circuito: String,
    equipamento: String,

    ocupacao: Number, // mudar para Number (estava String)
    temperatura: Number,
    co2: Number,
    iluminacao: Number,
    hvac: String,

    consumo: Number,
    potencia: Number,

    ligado: Number, // iluminação
    ativo: Number,  // avac

    humidade: Number,
    estado: String,

    vibracao: Number,
    alerta: String,

    timestamp: Date, // timestamp real do sensor

    receivedAt: {
      type: Date,
      default: Date.now,
      expires: 86400
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SensorReading", sensorReadingSchema);