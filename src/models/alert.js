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
      table: { type: String, default: "ambiente" },
      rowId: { type: Number, default: null },
      timestamp: { type: String, default: "" }
    },

    triggerData: {
      ocupacao: { type: String, default: "" },
      iluminacao: { type: String, default: "" },
      hvac: { type: String, default: "" },
      co2: { type: Number, default: null },
      temperatura: { type: Number, default: null }
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