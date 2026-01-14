// middlewares/issuesPermission.js
const Issue = require('../models/issues');
const User = require('../models/user');

/**
 * Middleware to enforce issue permissions
 * For creation: use on POST /api/issues
 * For update: use on PATCH /api/issues/:id
 */
async function issuesPermissionMiddleware(req, res, next) {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ error: 'Not logged in' });

        if (req.method === 'POST') {
            // Owners can create anything
            // Users cannot create
            // General users can create but cannot assign to owners
            if (user.role === 'user') {
                return res.status(403).json({ error: 'User cannot create issues' });
            }

            const { assignedToName } = req.body;
            if (user.role === 'general') {
                if (!assignedToName) {
                    return res.status(400).json({ error: 'General users must assign an issue' });
                }
                const assignedUser = await User.findOne({ name: assignedToName });
                if (!assignedUser) return res.status(400).json({ error: 'Assigned user not found' });
                if (assignedUser.role === 'owner') {
                    return res.status(403).json({ error: 'General users cannot assign issues to owners' });
                }
            }
        }

        if (req.method === 'PATCH') {
            const { id } = req.params;
            const issue = await Issue.findById(id);
            if (!issue) return res.status(404).json({ error: 'Issue not found' });

            if (user.role === 'general') {
                return res.status(403).json({ error: 'General users cannot update issues' });
            }

            if (user.role === 'user' && issue.assignedToName !== user.name) {
                return res.status(403).json({ error: 'User can only update their assigned issues' });
            }

            // Attach issue to request for controller convenience
            req.issue = issue;
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = issuesPermissionMiddleware;
