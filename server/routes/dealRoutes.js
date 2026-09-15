const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, dealController.getDeals);
router.post('/', authenticateToken, dealController.createDeal);
router.get('/stats', authenticateToken, dealController.getFinancialStats);
router.get('/stats/summary/:id', authenticateToken, dealController.getDealSummaryLetter);
// 🛡️ Sentinel: Removed unauthenticated internal migrate route to prevent remote code execution

module.exports = router;
