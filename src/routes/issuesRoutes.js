const express = require("express");
const router = express.Router();

const issuesController = require("../controllers/issuesController");
const issuesPermission = require("../middlewares/issuesPermission");
const validateIssueAssignment = require("../middlewares/validateIssueAssignment");

// Create issue
// Allowed: owner, general
router.post(
  "/",
  issuesPermission,
  validateIssueAssignment,
  issuesController.createIssue
);

// List issues (read-only, no restriction here)
router.get(
  "/",
  issuesController.listIssues
);

// Update issue
// Allowed: owner, user (own issues), general (rules enforced in middleware)
router.patch(
  "/:id",
  issuesPermission,
  validateIssueAssignment,
  issuesController.updateIssue
);

module.exports = router;
