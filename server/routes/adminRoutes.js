const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Enforce admin-only access on admin routes to prevent authorization bypass
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
