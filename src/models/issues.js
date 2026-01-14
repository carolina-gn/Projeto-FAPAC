// src/models/Issue.js
const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2 },
    description: { type: String, default: "" },

    status: {
      type: String,
      required: true,
      enum: ["aberta", "em_progresso", "resolvida", "fechada"]
    },

    priority: {
      type: String,
      required: true,
      enum: ["baixa", "media", "alta", "critica"]
    },

    type: {
      type: String,
      required: true,
      enum: ["avaria", "pedido", "inspecao"]
    },

    location: {
      building: { type: String, default: "" },
      floor: { type: String, default: "" },
      space: { type: String, default: "" }
    },

    modelLink: {
      building: { type: String, default: "" },
      element: { type: String, default: "" }
    },

    assignedToName: { type: String, default: "" }
  },
  { timestamps: true } // <-- cria createdAt e updatedAt automaticamente (perfeito para a tua validation)
);

module.exports = mongoose.model("Issue", IssueSchema);