const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Chrome Extension.
 * Validates the x-api-key header against the EXTENSION_API_KEY environment variable.
 * Uses timingSafeEqual with hashing to prevent timing attacks.
 */
const extensionAuth = (req, res, next) => {
    const expectedKey = process.env.EXTENSION_API_KEY;

    // Fail securely if the environment is not configured
    if (!expectedKey) {
        console.error('[AUTH] CRITICAL: EXTENSION_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Server authentication configuration error' });
    }

    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        console.warn(`[AUTH] Missing API Key from ${req.ip} for ${req.originalUrl}`);
        return res.status(401).json({ error: 'API Key required' });
    }

    try {
        // Use hashing + timingSafeEqual to securely compare keys of potentially different lengths
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const expectedKeyHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, expectedKeyHash)) {
            return next();
        }
    } catch (error) {
        console.error('[AUTH] Secure comparison error:', error);
    }

    console.warn(`[AUTH] Invalid API Key from ${req.ip} for ${req.originalUrl}`);
    return res.status(403).json({ error: 'Invalid API Key' });
};

module.exports = extensionAuth;
