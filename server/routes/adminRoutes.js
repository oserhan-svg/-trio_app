const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 🛡️ Sentinel: Enforced isAdmin middleware instead of authenticateToken to prevent authorization bypass. Admin routes must be restricted to users with the 'admin' role to prevent lower-privileged users from accessing sensitive dashboard statistics.
router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
