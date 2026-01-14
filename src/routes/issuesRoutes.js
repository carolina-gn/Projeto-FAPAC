// src/routes/issuesRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });

const issuesController = require("../controllers/issuesController");
const issuesPermission = require("../middlewares/issuesPermission");
const validateIssueAssignment = require("../middlewares/validateIssueAssignment");
const projectAccess = require("../middlewares/projectAccess");

router.post(
  "/",
  projectAccess,
  issuesPermission,
  validateIssueAssignment,
  issuesController.createIssue
);

router.get(
  "/",
  projectAccess,
  issuesController.listIssues
);

router.patch(
  "/:issueId",
  projectAccess,
  issuesPermission,
  validateIssueAssignment,
  issuesController.updateIssue
);

module.exports = router;