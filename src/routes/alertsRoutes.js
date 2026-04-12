const express = require("express");
const router = express.Router();
const alertsController = require("../controllers/alertsController");

router.get("/", alertsController.listAlerts);
router.get("/summary", alertsController.getAlertsSummary);
router.patch("/:alertId/resolve", alertsController.resolveAlert);

module.exports = router;