// src/routes/issuesRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams needed
const issuesController = require("../controllers/issuesController");
const issuesPermission = require("../middlewares/issuesPermission");
const validateIssueAssignment = require("../middlewares/validateIssueAssignment");
const projectAccess = require("../middlewares/projectAccess");

// Create a new issue
router.post(
  "/",
  projectAccess,
  issuesPermission,
  validateIssueAssignment,
  issuesController.createIssue
);

// List issues for a specific project
router.get(
  "/",
  projectAccess,
  issuesController.listIssues
);

// Update issue
router.patch(
  "/:issueId",
  projectAccess,
  issuesPermission,
  validateIssueAssignment,
  issuesController.updateIssue
);

module.exports = router;