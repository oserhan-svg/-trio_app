const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Secure admin endpoint by ensuring only users with the 'admin' role can access the stats.
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
