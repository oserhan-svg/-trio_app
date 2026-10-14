const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

router.get('/stats', isAdmin, getDashboardStats);

module.exports = router;
