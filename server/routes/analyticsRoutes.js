const express = require('express');
const router = express.Router();
const { getStats, getDemandStats, getNeighborhoodStats, getPipelineSummary } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getStats);
router.get('/demand-heatmap', authenticateToken, getDemandStats);
router.get('/neighborhood-stats', authenticateToken, getNeighborhoodStats);
router.get('/pipeline-summary', authenticateToken, getPipelineSummary);

module.exports = router;
