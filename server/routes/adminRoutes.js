const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Fixed authorization bypass by replacing authenticateToken with isAdmin to ensure only admins can access stats
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
