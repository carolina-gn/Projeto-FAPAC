// src/models/projectAccess.js
const mongoose = require('mongoose');
const Project = require('./project');
const User = require('./user');

const projectAccessSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['viewer'], default: 'viewer' }, // Can extend later
  createdAt: { type: Date, default: Date.now },
});

// Pre-save hook: validate viewer
projectAccessSchema.pre('save', async function() {
  const viewerUser = await User.findById(this.viewer);
  if (!viewerUser) throw new Error('Viewer user not found');

  // Prevent adding owners as viewers of someone else's project
  if (viewerUser.role === 'owner' && String(viewerUser._id) !== String(this.invitedBy)) {
    throw new Error('Owners cannot be added as viewers of someone else’s project');
  }
});

const ProjectAccess = mongoose.model('ProjectAccess', projectAccessSchema);

/**
 * Middleware to check if the logged-in user has access to a project
 * Expects projectId as req.params.projectId
 */
async function projectAccessMiddleware(req, res, next) {
  try {
    const user = req.session.user;
    const { projectId } = req.params;

    if (!user) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Owner always has access
    if (project.owner.toString() === user.id) {
      req.project = project;
      return next();
    }

    // Check ProjectAccess
    const access = await ProjectAccess.findOne({
      project: project._id,
      viewer: user.id,
    });

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.project = project;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { ProjectAccess, projectAccessMiddleware };