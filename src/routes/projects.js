// src/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/project.js');
const { ProjectAccess, projectAccessMiddleware } = require('../models/projectAccess.js');
const Issue = require('../models/issues.js');

// Utility to format projects for frontend
function toClientProject(project) {
  return {
    id: project._id,
    name: project.name,
    twinId: project.autodeskProjectId
  };
}

// ----------------------
// 1️⃣ List all projects visible to user
// GET /api/projects
// ----------------------
router.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  try {
    // Projects owned by user
    const owned = await Project.find({ owner: user.id });

    // Projects where user has viewer access
    const accesses = await ProjectAccess.find({ viewer: user.id }).populate('project');
    const viewed = accesses.map(a => a.project);

    const projects = [...owned, ...viewed].map(toClientProject);
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// 2️⃣ Get all issues user has access to
// GET /api/projects/issues
// ----------------------
router.get('/issues', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const owned = await Project.find({ owner: user.id }, '_id');
    const accesses = await ProjectAccess.find({ viewer: user.id }, 'project');
    const viewed = accesses.map(a => a.project);

    const projectIds = [...owned.map(p => p._id), ...viewed];
    const issues = await Issue.find({ project: { $in: projectIds } }).sort({ updatedAt: -1 });

    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// 3️⃣ Get issues for a single project
// GET /api/projects/:projectId/issues
// ----------------------
router.get('/:projectId/issues', projectAccessMiddleware, async (req, res) => {
  try {
    const issues = await Issue.find({ project: req.project._id }).sort({ updatedAt: -1 });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// 4️⃣ Get single project details
// GET /api/projects/:projectId
// ----------------------
router.get('/:projectId', projectAccessMiddleware, async (req, res) => {
  res.json({ project: toClientProject(req.project) });
});

module.exports = router;

// GET /api/projects/:projectId/users
router.get('/:projectId/users', projectAccessMiddleware, async (req, res) => {
  try {
    const project = req.project;

    // Owner first
    const users = [project.owner];

    // Add all viewers from ProjectAccess
    const accesses = await ProjectAccess.find({ project: project._id }).populate('viewer');
    accesses.forEach(a => {
      if (a.viewer && !users.find(u => String(u._id) === String(a.viewer._id))) {
        users.push(a.viewer);
      }
    });

    // Map to frontend-friendly format
    const result = users.map(u => ({
      id: u._id,
      name: u.name || u.email || 'Usuário'
    }));

    res.json({ users: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
