const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/stats', authenticateToken, authorizeRole('admin'), getDashboardStats);

module.exports = router;
