// src/middlewares/issuesPermission.js
const Issue = require("../models/issues");

module.exports = async function issuesPermission(req, res, next) {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "Not logged in" });

    const role = user.role;
    const isCreate = req.method === "POST";
    const isUpdate = req.method === "PATCH";

    // CREATE
    if (isCreate) {
      if (role === "owner" || role === "general") return next();
      return res.status(403).json({ error: "You cannot create issues" });
    }

    // UPDATE
    if (isUpdate) {
      const issue = await Issue.findById(req.params.issueId);
      if (!issue) return res.status(404).json({ error: "Issue not found" });

      req.issue = issue; // attach for controller

      if (role === "owner") return next();

      if (role === "user") {
        if (issue.createdBy.toString() === user.id) return next();
        return res.status(403).json({ error: "You can only modify your own issues" });
      }

      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Permission check failed" });
  }
};