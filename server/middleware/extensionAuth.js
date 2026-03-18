const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Trio Assistant Chrome Extension
 * uses a static API key shared between the extension and the server.
 */
const extensionAuth = (req, res, next) => {
    const apiKey = process.env.EXTENSION_API_KEY;

    if (!apiKey) {
        console.error('🛡️ [Sentinel] CRITICAL: EXTENSION_API_KEY is not set in environment variables');
        // Fail securely - do not allow any requests if the key is not configured
        return res.status(500).json({ error: 'Internal server configuration error' });
    }

    const providedKey = req.headers['x-api-key'];

    if (!providedKey) {
        return res.status(401).json({ error: 'Unauthorized: API Key missing' });
    }

    // Use SHA-256 to ensure fixed length for timingSafeEqual and avoid leaking length info
    const apiHash = crypto.createHash('sha256').update(apiKey).digest();
    const providedHash = crypto.createHash('sha256').update(providedKey).digest();

    if (crypto.timingSafeEqual(apiHash, providedHash)) {
        return next();
    }

    console.warn(`🛡️ [Sentinel] Unauthorized extension access attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
};

module.exports = extensionAuth;
