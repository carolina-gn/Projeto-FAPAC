// src/models/projectAccess.js
const mongoose = require('mongoose');

const projectAccessSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['viewer'], default: 'viewer' }, // Can extend later
  createdAt: { type: Date, default: Date.now },
});

// Optional: ensure non-owners only added as viewers
projectAccessSchema.pre('save', async function(next) {
  const User = require('./user');
  const viewerUser = await User.findById(this.viewer);
  if (!viewerUser) return next(new Error('Viewer user not found'));
  if (viewerUser.role === 'owner' && String(viewerUser._id) !== String(this.invitedBy)) {
    return next(new Error('Owners cannot be added as viewers of someone else’s project'));
  }
  next();
});

module.exports = mongoose.model('ProjectAccess', projectAccessSchema);
