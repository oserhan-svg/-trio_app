const express = require('express');
const router = express.Router();
const pc = require('../controllers/propertyController');
const { exportPropertiesToExcel } = require('../services/excelService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { scrapeLimiter } = require('../middleware/rateLimiter');

// Note: /stats MUST remain before /:id
router.get('/metadata', authenticateToken, pc.getFilterMetadata);
router.get('/stats', authenticateToken, pc.getPortfolioStats);
router.get('/export', authenticateToken, exportPropertiesToExcel);
router.get('/', authenticateToken, pc.getProperties);
// router.get('/', pc.getProperties);

router.get('/:id', authenticateToken, pc.getPropertyById);
router.get('/:id/history', authenticateToken, pc.getPropertyHistory);
router.get('/:id/twins', authenticateToken, pc.getPropertyTwins);
router.get('/:id/social-media', authenticateToken, pc.generateSocialMediaContent);
router.post('/:id/scrape-details', authenticateToken, scrapeLimiter, pc.scrapePropertyDetails);
router.put('/:id/assign', authenticateToken, pc.assignProperty);
router.put('/:id', authenticateToken, pc.updateProperty);

router.post('/sync-portfolio', authenticateToken, pc.syncPortfolio);

module.exports = router;
