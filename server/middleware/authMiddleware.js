const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.warn(`JWT Verification Failed: ${err.message}`);
            return res.status(401).json({
                error: 'Invalid or expired token',
                code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
            });
        }
        req.user = user;
        next();
    });
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.sendStatus(403);
        }
        next();
    };
};

const isAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};

/**
 * extensionAuth middleware
 * Secures extension-only endpoints using a shared API Key
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-extension-api-key'];
    const serverKey = process.env.EXTENSION_API_KEY;

    if (!serverKey) {
        console.error('❌ [AUTH] EXTENSION_API_KEY is not defined in environment variables.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API Key required' });
    }

    try {
        // Use timingSafeEqual to prevent timing attacks
        // Both strings must be hashed to the same length before comparison
        const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest();
        const hashedServerKey = crypto.createHash('sha256').update(serverKey).digest();

        if (crypto.timingSafeEqual(hashedApiKey, hashedServerKey)) {
            return next();
        }
    } catch (error) {
        console.error('Error during extension auth comparison:', error);
    }

    console.warn(`⚠️ [AUTH] Unauthorized extension access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Invalid Extension API Key' });
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
