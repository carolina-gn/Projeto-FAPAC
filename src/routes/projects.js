const express = require('express');
const router = express.Router();
const Project = require('../models/project.js');
const ProjectAccess = require('../models/projectAccess.js');
const projectAccessMiddleware = require('../middlewares/projectAccess.js');
function toClientProject(project) {
    return {
        id: project._id,
        name: project.name,
        twinId: project.autodeskProjectId
    };
}

// List all projects visible to the logged-in user
router.get('/api/projects', async (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: 'Not logged in' });

    try {
        // Projects owned by user
        const owned = await Project.find({ owner: user.id });

        // Projects user is a viewer of
        const accesses = await ProjectAccess.find({ viewer: user.id }).populate('project');
        const viewed = accesses.map(a => a.project);

        const projects = [...owned, ...viewed].map(toClientProject);
        res.json({ projects });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Example: get project details by ID (only if allowed)
router.get('/api/projects/:projectId', projectAccessMiddleware, async (req, res) => {
    res.json({
    project: toClientProject(req.project)
    });

});

module.exports = router;
