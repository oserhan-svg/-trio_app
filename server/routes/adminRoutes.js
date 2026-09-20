const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Enforce admin authorization on admin stats route to prevent data leakage
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
