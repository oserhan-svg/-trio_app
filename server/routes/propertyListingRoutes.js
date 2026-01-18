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

const validate = require('../middleware/validate');
const { listingSchema } = require('../utils/schemas');

// Protected routes - require authentication
router.post('/generate', authenticateToken, validate(listingSchema), generateListing);
router.post('/:propertyId/generate-ai', authenticateToken, generateDescription);
router.get('/property/:propertyId', authenticateToken, getListingsByProperty);
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;
