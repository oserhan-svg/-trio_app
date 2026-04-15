const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Chrome Extension
 * uses a simple but secure API key validation
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.EXTENSION_API_KEY;

    // If no key is configured, reject all requests to these endpoints as a safety measure
    if (!expectedKey) {
        console.error('🚨 [SECURITY] EXTENSION_API_KEY is not set. Blocking extension access.');
        return res.status(500).json({
            error: 'Server configuration error (API Key missing)',
            code: 'MISSING_EXTENSION_KEY'
        });
    }

    if (!apiKey) {
        return res.status(401).json({
            error: 'API Key is required',
            code: 'API_KEY_REQUIRED'
        });
    }

    try {
        // Use timing-safe comparison with SHA-256 hashing to protect against timing attacks
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const expectedKeyHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, expectedKeyHash)) {
            return next();
        }
    } catch (error) {
        console.error('[SECURITY] Extension Auth Error:', error);
    }

    console.warn(`⚠️ [SECURITY] Unauthorized extension access attempt from IP: ${req.ip}`);
    return res.status(401).json({
        error: 'Invalid API Key',
        code: 'INVALID_API_KEY'
    });
};

module.exports = extensionAuth;
