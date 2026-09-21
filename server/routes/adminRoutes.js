const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Secure admin stats endpoint to prevent unauthorized data access
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
