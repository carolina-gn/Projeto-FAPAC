// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: String,          // for DTGE login (viewers)
  role: { type: String, enum: ['owner', 'viewer'], required: true },
  autodeskId: String,            // only for owners
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
