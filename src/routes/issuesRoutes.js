// src/routes/issuesRoutes.js
const express = require("express");
const router = express.Router();
const issuesController = require("../controllers/issuesController");

router.post("/", issuesController.createIssue);
router.get("/", issuesController.listIssues); 
router.patch("/:id", issuesController.updateIssue);

module.exports = router;