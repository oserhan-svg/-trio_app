const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    generateListing,
    getListingByToken,
    getListingsByProperty,
    deleteListing,
    generateDescription
} = require('../controllers/propertyListingController');

// Public route - no authentication required
router.get('/token/:token', getListingByToken);

// Protected routes - require authentication
router.post('/generate', authenticateToken, generateListing);
router.post('/:propertyId/generate-ai', authenticateToken, generateDescription);
router.get('/property/:propertyId', authenticateToken, getListingsByProperty);
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;
