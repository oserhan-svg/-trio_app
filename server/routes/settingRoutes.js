const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, settingController.getSettings);
// 🛡️ Sentinel: Restrict setting modifications to admins to prevent unauthorized configuration changes
router.post('/', isAdmin, settingController.updateSetting);
router.post('/refresh-rental-rate', isAdmin, settingController.refreshRentalRate);
router.get('/company', authenticateToken, settingController.getCompanyConfig);

module.exports = router;
