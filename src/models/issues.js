// src/models/issues.js
const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2 },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["aberta", "em_progresso", "resolvida", "fechada"],
      default: "aberta"
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    location: {
      building: String,
      floor: String,
      space: String
    },

    modelLink: {
      building: String,
      elementId: String,
      element: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);