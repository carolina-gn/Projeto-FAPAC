// src/middlewares/validateIssueAssignment.js
const User = require("../models/user");
const ProjectAccess = require("../models/projectAccess");

module.exports = async function validateIssueAssignment(req, res, next) {
  const { assignedTo } = req.body;
  if (!assignedTo) return next();

  try {
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(400).json({ error: "Assigned user does not exist" });
    }

    const projectId = req.params.projectId;

    const hasAccess =
      user.role === "owner" ||
      (await ProjectAccess.exists({
        project: projectId,
        viewer: user._id
      }));

    if (!hasAccess) {
      return res.status(400).json({
        error: "Assigned user has no access to this project"
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Assignment validation failed" });
  }
};