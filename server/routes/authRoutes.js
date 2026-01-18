const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const validate = require('../middleware/validate');
const { authSchema } = require('../utils/schemas');

router.post('/login', authLimiter, validate(authSchema), login);

module.exports = router;
