const express = require('express');
const router = express.Router();
const { getProperties, getPropertyHistory, getPropertyById, scrapePropertyDetails } = require('../controllers/propertyController');
const { exportPropertiesToExcel } = require('../services/excelService');
const { scrapeProperties } = require('../services/scraperService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Scraper Trigger
router.post('/scrape', authenticateToken, async (req, res) => {
    try {
        console.log('Manual scrape triggered via API');
        // Run in background
        scrapeProperties('all').catch(err => console.error('Manual scrape failed:', err));
        res.json({ message: 'Scraping started in background' });
    } catch (e) {
        console.error('Trigger error:', e);
        res.status(500).json({ error: 'Failed to start scraper' });
    }
});

router.get('/', authenticateToken, getProperties);
router.get('/export', authenticateToken, exportPropertiesToExcel);
router.get('/:id', authenticateToken, getPropertyById); // Move basic detail fetch here too
router.post('/:id/scrape-details', authenticateToken, scrapePropertyDetails);
router.get('/:id/history', authenticateToken, getPropertyHistory);
router.put('/:id/assign', authenticateToken, require('../controllers/propertyController').assignProperty);

module.exports = router;
