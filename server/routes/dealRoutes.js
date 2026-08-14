const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken, authorizeRole, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, dealController.getDeals);
router.post('/', authenticateToken, dealController.createDeal);
router.get('/stats', authenticateToken, dealController.getFinancialStats);
router.get('/stats/summary/:id', authenticateToken, dealController.getDealSummaryLetter);
// 🛡️ Sentinel: Added isAdmin role check to prevent unauthorized schema changes
router.get('/internal/migrate', isAdmin, dealController.runInternalMigration);

module.exports = router;
