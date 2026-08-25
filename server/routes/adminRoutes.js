const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Enforce admin-only access to prevent unauthorized users from viewing admin stats
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
