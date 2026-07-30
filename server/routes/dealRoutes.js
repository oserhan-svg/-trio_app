const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken, authorizeRole, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, dealController.getDeals);
router.post('/', authenticateToken, dealController.createDeal);
router.get('/stats', authenticateToken, dealController.getFinancialStats);
router.get('/stats/summary/:id', authenticateToken, dealController.getDealSummaryLetter);
// SECURE: Require admin privileges for internal shell execution routes
router.get('/internal/migrate', isAdmin, dealController.runInternalMigration);

module.exports = router;
