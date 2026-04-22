const crypto = require('crypto');

/**
 * Middleware to authenticate requests from the Chrome Extension
 * uses a static key defined in environment variables
 */
const extensionAuth = (req, res, next) => {
    const extensionKey = req.headers['x-extension-key'];
    const serverKey = process.env.EXTENSION_KEY;

    // Fail securely if no key is configured on server
    if (!serverKey) {
        console.error('🚨 [SECURITY] EXTENSION_KEY is not set in environment variables. Denying extension access.');
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'Extension authentication is not configured.'
        });
    }

    if (!extensionKey) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Missing extension key'
        });
    }

    try {
        // Use timingSafeEqual to prevent timing attacks
        const extensionKeyBuffer = Buffer.from(extensionKey);
        const serverKeyBuffer = Buffer.from(serverKey);

        if (extensionKeyBuffer.length === serverKeyBuffer.length &&
            crypto.timingSafeEqual(extensionKeyBuffer, serverKeyBuffer)) {
            return next();
        }
    } catch (error) {
        console.error('Auth comparison error:', error);
    }

    console.warn(`⚠️ [SECURITY] Unauthorized extension access attempt from IP: ${req.ip}`);
    return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid extension key'
    });
};

module.exports = extensionAuth;
