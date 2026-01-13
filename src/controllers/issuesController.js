// src/controllers/issuesController.js
const Issue = require("../models/issues");

// POST /api/issues
exports.createIssue = async (req, res) => {
  try {
    const issue = await Issue.create(req.body);
    return res.status(201).json(issue);
  } catch (err) {
    // Se a validation do Mongo recusar algo, vem um erro aqui
    return res.status(400).json({
      message: "Erro ao criar issue",
      error: err.messages
    });
  }
};

// GET /api/issues 
exports.listIssues = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const issues = await Issue.find(filter).sort({ updatedAt: -1 });
    return res.json(issues);
  } catch (err) {
    return res.status(500).json({ message: "Erro ao listar issues" });
  }
};

// PATCH /api/issues/:id
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;

    // só deixa atualizar campos que queres permitir
    const allowed = [
      "title",
      "description",
      "status",
      "priority",
      "type",
      "assignedToName",
      "location",
      "modelLink"
    ];

    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true } // devolve já o doc atualizado
    );

    if (!issue) return res.status(404).json({ message: "Issue não encontrada" });

    return res.json(issue);
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: "Erro ao atualizar issue",
      error: err.message
    });
  }
};