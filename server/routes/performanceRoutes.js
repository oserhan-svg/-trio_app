const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Only allow admins to view consultant performance
router.get('/', authenticateToken, authorizeRole('admin'), performanceController.getConsultantPerformance);
router.get('/:id', authenticateToken, authorizeRole('admin'), performanceController.getConsultantDetail);

module.exports = router;
