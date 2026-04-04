const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Middleware to authenticate requests from the Chrome Extension
 * uses a secure constant-time comparison of API keys.
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-extension-api-key'];
    const serverKey = process.env.EXTENSION_API_KEY;

    if (!serverKey) {
        console.error('❌ EXTENSION_API_KEY is not defined in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API key required' });
    }

    try {
        // Use SHA-256 to hash both keys before comparison to handle different lengths
        // and prevent timing attacks via timingSafeEqual.
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const serverKeyHash = crypto.createHash('sha256').update(serverKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, serverKeyHash)) {
            next();
        } else {
            console.warn(`⚠️ Invalid extension API key attempt from origin: ${req.headers.origin || 'unknown'}`);
            res.status(401).json({ error: 'Invalid Extension API key' });
        }
    } catch (error) {
        console.error('Extension Auth Error:', error);
        res.status(500).json({ error: 'Authentication processing error' });
    }
};

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

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
