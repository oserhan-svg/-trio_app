const crypto = require('crypto');

/**
 * Extension Authentication Middleware
 * Validates requests coming from the Trio Assistant Chrome Extension
 * Uses timing-safe comparison to prevent timing attacks
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const configuredKey = process.env.EXTENSION_API_KEY;

    // If no key is configured, we allow requests but log a warning in non-production
    if (!configuredKey) {
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ CRITICAL: EXTENSION_API_KEY is not set in production!');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        return next();
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: Missing Extension API Key' });
    }

    try {
        // Timing-safe comparison to prevent timing attacks
        const apiKeyBuffer = Buffer.from(apiKey);
        const configuredKeyBuffer = Buffer.from(configuredKey);

        if (apiKeyBuffer.length !== configuredKeyBuffer.length ||
            !crypto.timingSafeEqual(apiKeyBuffer, configuredKeyBuffer)) {
            console.warn(`🛑 Unauthorized extension access attempt from IP: ${req.ip}`);
            return res.status(401).json({ error: 'Unauthorized: Invalid Extension API Key' });
        }
    } catch (error) {
        console.error('Extension Auth Error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

module.exports = extensionAuth;
