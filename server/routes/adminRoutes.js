const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Secure admin endpoint using isAdmin instead of generic authenticateToken
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
