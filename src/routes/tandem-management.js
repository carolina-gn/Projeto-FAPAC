const express = require('express');
const { authRefreshMiddleware } = require('../middlewares/auth.js');
const { getModelByUrn } = require('../controllers/tandem-management.js');

const router = express.Router();

// Optional middleware to ensure user is authenticated
router.use('/api/tandem', authRefreshMiddleware);

module.exports = router;