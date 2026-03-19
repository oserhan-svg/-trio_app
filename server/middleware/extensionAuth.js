const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Chrome Extension
 * uses a secure constant-time comparison to prevent timing attacks
 */
const extensionAuth = (req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    const expectedKey = process.env.EXTENSION_API_KEY;

    // Fail securely if the API key is not configured on the server
    if (!expectedKey) {
        console.error('🛡️ [SECURITY] CRITICAL: EXTENSION_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!providedKey) {
        return res.status(401).json({ error: 'API Key required' });
    }

    try {
        // Use SHA-256 to hash both keys to ensure they have the same length
        // before performing constant-time comparison
        const providedHash = crypto.createHash('sha256').update(providedKey).digest();
        const expectedHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(providedHash, expectedHash)) {
            return next();
        }
    } catch (error) {
        console.error('🛡️ [SECURITY] Error during API key validation:', error);
    }

    // Generic error for invalid keys to avoid leaking information
    res.status(403).json({ error: 'Forbidden' });
};

module.exports = extensionAuth;
