const User = require("../models/user");
const Project = require("../models/project");
const ProjectAccess = require("../models/projectAccess");

const ROLE_RANK = {
  owner: 3,
  user: 2,
  general: 1
};

module.exports = async function validateIssueAssignment(req, res, next) {
  try {
    const { assignedTo, project } = req.body;
    const requester = req.session.user;

    if (!assignedTo) return next();
    if (!requester) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const targetUser = await User.findById(assignedTo);
    if (!targetUser) {
      return res.status(400).json({ error: "Assigned user does not exist" });
    }

    // 🔒 Role hierarchy enforcement
    if (ROLE_RANK[requester.role] < ROLE_RANK[targetUser.role]) {
      return res.status(403).json({
        error: "You cannot assign issues to users with higher roles"
      });
    }

    const proj = await Project.findById(project);
    if (!proj) {
      return res.status(400).json({ error: "Project does not exist" });
    }

    // Owner always has access
    if (proj.owner.toString() === targetUser._id.toString()) {
      return next();
    }

    const access = await ProjectAccess.findOne({
      project: project,
      viewer: targetUser._id
    });

    if (!access) {
      return res.status(403).json({
        error: "Assigned user does not have access to this project"
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};