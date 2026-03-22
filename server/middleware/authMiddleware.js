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
 * Middleware to authenticate Chrome Extension requests via API Key
 * Uses constant-time comparison to prevent timing attacks
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.EXTENSION_API_KEY;

    if (!expectedKey) {
        console.error('🚨 [SECURITY] EXTENSION_API_KEY not configured on server');
        return res.status(500).json({ error: 'Server authentication configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API key required' });
    }

    try {
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const expectedKeyHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, expectedKeyHash)) {
            return next();
        }
    } catch (error) {
        console.error('Auth hashing error:', error);
    }

    console.warn(`⚠️ [SECURITY] Invalid extension API key attempt from ${req.ip}`);
    res.status(403).json({ error: 'Invalid extension API key' });
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
