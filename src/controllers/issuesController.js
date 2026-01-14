// src/controllers/issuesController.js
const Issue = require("../models/issues");

// POST /api/issues
exports.createIssue = async (req, res) => {
  try {
    const issue = await Issue.create(req.body);
    return res.status(201).json(issue);
  } catch (err) {
    return res.status(400).json({
      message: "Erro ao criar issue",
      error: err.message
    });
  }
};

// GET /api/issues
exports.listIssues = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const issues = await Issue
      .find(filter)
      .sort({ updatedAt: -1 });

    return res.json(issues);
  } catch (err) {
    return res.status(500).json({
      message: "Erro ao listar issues",
      error: err.message
    });
  }
};

// PATCH /api/issues/:id
exports.updateIssue = async (req, res) => {
  try {
    const issue = req.issue; // 👈 comes from middleware

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

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        issue[key] = req.body[key];
      }
    }

    await issue.save(); // triggers validation

    return res.json(issue);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: "Erro ao atualizar issue",
      error: err.message
    });
  }
};