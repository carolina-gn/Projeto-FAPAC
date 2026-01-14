// src/models/project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  autodeskProjectId: { type: String, required: true }, // Facility URN
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  createdAt: { type: Date, default: Date.now },
});

// Ensure only owners can be project owners
projectSchema.pre('save', async function(next) {
  const User = require('./user');
  const ownerUser = await User.findById(this.owner);
  if (!ownerUser || ownerUser.role !== 'owner') {
    return next(new Error('Only users with role "owner" can be project owners'));
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);