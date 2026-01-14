// src/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/project.js');
const { ProjectAccess, projectAccessMiddleware } = require('../models/projectAccess.js');
const Issue = require('../models/issues.js');
const issuesRoutes = require('./issuesRoutes');

// Utility: format project for frontend
function toClientProject(project) {
  return {
    id: project._id,
    name: project.name,
    twinId: project.autodeskProjectId
  };
}

// 1️⃣ List all projects visible to user
router.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  try {
    const owned = await Project.find({ owner: user.id });
    const accesses = await ProjectAccess.find({ viewer: user.id }).populate('project');
    const viewed = accesses.map(a => a.project);

    const projects = [...owned, ...viewed].map(toClientProject);
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2️⃣ Get all issues user has access to
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

// 3️⃣ Get single project details
router.get('/:projectId', projectAccessMiddleware, async (req, res) => {
  res.json({ project: toClientProject(req.project) });
});

// 4️⃣ Get users for a project
router.get('/:projectId/users', projectAccessMiddleware, async (req, res) => {
  try {
    const project = req.project;

    const users = [project.owner]; // Owner first
    const accesses = await ProjectAccess.find({ project: project._id }).populate('viewer');
    accesses.forEach(a => {
      if (a.viewer && !users.find(u => String(u._id) === String(a.viewer._id))) {
        users.push(a.viewer);
      }
    });

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

// 5️⃣ Mount issues routes under /:projectId/issues
// All issue routes will have req.project populated via projectAccessMiddleware
router.use('/:projectId/issues', issuesRoutes);

module.exports = router;