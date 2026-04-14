const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Chrome Extension
 * Uses a pre-shared API key (EXTENSION_API_KEY) via the x-api-key header.
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.EXTENSION_API_KEY;

    // Fail if server is not configured correctly
    if (!expectedKey) {
        console.error('🚨 SECURITY ALERT: EXTENSION_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API key required' });
    }

    try {
        // Use SHA-256 to hash both keys before comparison.
        // This ensures both buffers have the same length for timingSafeEqual
        // and prevents leaking the actual key length.
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const expectedKeyHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, expectedKeyHash)) {
            return next();
        }
    } catch (error) {
        console.error('Error during extension authentication:', error);
    }

    // Default to rejection
    res.status(401).json({ error: 'Invalid Extension API key' });
};

module.exports = extensionAuth;
