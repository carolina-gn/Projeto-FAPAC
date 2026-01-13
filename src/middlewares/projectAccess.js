const Project = require('../models/project.js');
const ProjectAccess = require('../models/projectAccess.js');

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
            req.project = project; // attach project to request
            return next();
        }

        // Check ProjectAccess
        const access = await ProjectAccess.findOne({
            project: project._id,
            viewer: user.id
        });

        if (!access) {
            return res.status(403).json({ error: 'Access denied' });
        }

        req.project = project; // attach project to request
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = projectAccessMiddleware;
