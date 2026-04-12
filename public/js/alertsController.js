const Alert = require("../models/alert");

exports.listAlerts = async (req, res) => {
  try {
    const { status, sala } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (sala) {
      filter.sala = sala;
    }

    const alerts = await Alert.find(filter).sort({ updatedAt: -1, createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({
      message: "Erro ao listar alertas",
      error: err.message
    });
  }
};

exports.getAlertsSummary = async (req, res) => {
  try {
    const ativos = await Alert.countDocuments({ status: "ativo" });
    const resolvidos = await Alert.countDocuments({ status: "resolvido" });

    res.json({
      ativos,
      resolvidos
    });
  } catch (err) {
    res.status(500).json({
      message: "Erro ao obter resumo de alertas",
      error: err.message
    });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const userName = req.session?.user?.name || req.session?.user?.username || "Utilizador";

    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      {
        status: "resolvido",
        resolvedAt: new Date(),
        resolvedByName: userName,
        resolutionNote: req.body?.resolutionNote || ""
      },
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alerta não encontrado" });
    }

    res.json(alert);
  } catch (err) {
    res.status(400).json({
      message: "Erro ao resolver alerta",
      error: err.message
    });
  }
};