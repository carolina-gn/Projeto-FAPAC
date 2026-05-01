const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    ruleKey: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["energia", "ambiente", "seguranca", "ocupacao"],
      default: "energia"
    },

    severity: {
      type: String,
      enum: ["baixa", "media", "alta", "critica"],
      default: "media"
    },

    sala: {
      type: String,
      default: ""
    },

    source: {
      table: { type: String, default: "sensorreadings" },
      rowId: { type: String, default: "" },
      timestamp: { type: String, default: "" }
    },

    triggerData: {
      tipo: { type: String, default: "" },
      sub_tipo: { type: String, default: "" },

      ocupacao: { type: Number, default: null },
      iluminacao: { type: Number, default: null },
      hvac: { type: String, default: "" },

      co2: { type: Number, default: null },
      temperatura: { type: Number, default: null },

      consumo: { type: Number, default: null },
      potencia: { type: Number, default: null },

      humidade: { type: Number, default: null },
      estado: { type: String, default: "" },

      vibracao: { type: Number, default: null },
      alerta: { type: String, default: "" },

      local: { type: String, default: "" },
      circuito: { type: String, default: "" },
      equipamento: { type: String, default: "" }
    },

    status: {
      type: String,
      enum: ["ativo", "resolvido"],
      default: "ativo"
    },

    firstDetectedAt: {
      type: Date,
      default: Date.now
    },

    lastDetectedAt: {
      type: Date,
      default: Date.now
    },

    resolvedAt: {
      type: Date,
      default: null
    },

    resolvedByName: {
      type: String,
      default: ""
    },

    resolutionNote: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

AlertSchema.index({ ruleKey: 1, sala: 1, status: 1 });

module.exports = mongoose.model("Alert", AlertSchema);