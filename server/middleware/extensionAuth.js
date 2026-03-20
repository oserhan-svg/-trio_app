const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Chrome Extension
 * Uses a secure constant-time comparison with SHA-256 hashing
 */
const extensionAuth = (req, res, next) => {
    const apiKey = process.env.EXTENSION_API_KEY;

    // Fail securely if API key is not configured
    if (!apiKey) {
        console.error('🚨 [SECURITY] EXTENSION_API_KEY is not set in environment variables');
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Security configuration missing'
        });
    }

    const providedKey = req.headers['x-api-key'];

    if (!providedKey) {
        console.warn(`⚠️ [SECURITY] Unauthenticated extension request blocked from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Missing API Key' });
    }

    try {
        // Use SHA-256 to ensure both buffers have the same length for timingSafeEqual
        const providedKeyHash = crypto.createHash('sha256').update(providedKey).digest();
        const expectedKeyHash = crypto.createHash('sha256').update(apiKey).digest();

        if (crypto.timingSafeEqual(providedKeyHash, expectedKeyHash)) {
            return next();
        }
    } catch (error) {
        console.error('❌ [SECURITY] Extension Auth Error:', error.message);
    }

    console.warn(`⚠️ [SECURITY] Invalid API Key provided from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
};

module.exports = extensionAuth;
