// src/controllers/issuesController.js
const Issue = require("../models/issues");

// POST /projects/:projectId/issues
exports.createIssue = async (req, res) => {
  try {
    const user = req.session.user;

    const issue = await Issue.create({
      ...req.body,
      project: req.params.projectId,
      createdBy: user.id
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({
      message: "Erro ao criar issue",
      error: err.message
    });
  }
};

// GET /projects/:projectId/issues
exports.listIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      project: req.params.projectId
    }).sort({ updatedAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: "Erro ao listar issues" });
  }
};

// PATCH /projects/:projectId/issues/:issueId
exports.updateIssue = async (req, res) => {
  try {
    const allowed = [
      "title",
      "description",
      "status",
      "priority",
      "type",
      "assignedTo",
      "location",
      "modelLink"
    ];

    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.issueId,
      update,
      { new: true, runValidators: true }
    );

    res.json(issue);
  } catch (err) {
    res.status(400).json({
      message: "Erro ao atualizar issue",
      error: err.message
    });
  }
};