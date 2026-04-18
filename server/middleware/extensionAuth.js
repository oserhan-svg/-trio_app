const crypto = require('crypto');
require('dotenv').config();

/**
 * Extension Authentication Middleware
 * Validates the X-Extension-Key header against EXTENSION_API_KEY environment variable.
 * Uses SHA-256 hashing and timing-safe comparison to prevent timing attacks.
 */
const extensionAuth = (req, res, next) => {
    const providedKey = req.headers['x-extension-key'];
    const expectedKey = process.env.EXTENSION_API_KEY;

    if (!expectedKey) {
        console.error('[AUTH] EXTENSION_API_KEY is not configured on the server');
        return res.status(500).json({ error: 'Server authentication misconfiguration' });
    }

    if (!providedKey) {
        console.warn(`[AUTH] Extension key missing from ${req.ip}`);
        return res.status(401).json({ error: 'Extension API key required' });
    }

    try {
        // Hash both keys to ensure they have the same length before timingSafeEqual
        const providedHash = crypto.createHash('sha256').update(providedKey).digest();
        const expectedHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(providedHash, expectedHash)) {
            return next();
        }
    } catch (error) {
        console.error('[AUTH] Error during key verification:', error.message);
    }

    console.warn(`[AUTH] Invalid extension key provided from ${req.ip}`);
    res.status(401).json({ error: 'Invalid extension API key' });
};

module.exports = extensionAuth;
