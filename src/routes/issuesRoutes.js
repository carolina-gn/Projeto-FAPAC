// src/routes/issuesRoutes.js
const express = require("express");
const router = express.Router();
const issuesController = require("../controllers/issuesController");

router.post("/", issuesController.createIssue);
router.get("/", issuesController.listIssues); // opcional

module.exports = router;