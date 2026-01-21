const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const { uploadDocument } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: POST /api/upload/document
// Expects form-data with key 'file'
router.post('/document', authenticateToken, upload.single('file'), uploadDocument);

module.exports = router;
