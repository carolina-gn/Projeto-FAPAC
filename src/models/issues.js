// src/models/issues.js
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

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    location: {
      building: { type: String, default: "" },
      floor: { type: String, default: "" },
      space: { type: String, default: "" }
    },

    modelLink: {
      building: { type: String, default: "" },
      elementId: { type: String, default: "" },
      element: { type: String, default: "" }
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);