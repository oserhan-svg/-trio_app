const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, settingController.getSettings);
router.post('/', authenticateToken, settingController.updateSetting);
router.post('/refresh-rental-rate', authenticateToken, settingController.refreshRentalRate);
router.get('/company', authenticateToken, settingController.getCompanyConfig);

module.exports = router;
