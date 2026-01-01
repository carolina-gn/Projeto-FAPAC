// src/models/projectAccess.js
const mongoose = require('mongoose');

const projectAccessSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['viewer'], default: 'viewer' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectAccess', projectAccessSchema);
