const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getStats);

module.exports = router;
