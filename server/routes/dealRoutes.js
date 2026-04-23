const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, dealController.getDeals);
router.post('/', authenticateToken, dealController.createDeal);
router.get('/stats', authenticateToken, dealController.getFinancialStats);
router.get('/stats/summary/:id', authenticateToken, dealController.getDealSummaryLetter);

// 🛡️ Sentinel: Secured migration endpoint to prevent unauthorized RCE/DB modification
router.get('/internal/migrate', authenticateToken, authorizeRole('admin'), dealController.runInternalMigration);

module.exports = router;
