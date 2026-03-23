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
 * Middleware for Chrome Extension authentication using API key
 * Uses constant-time comparison to prevent timing attacks
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const serverKey = process.env.EXTENSION_API_KEY;

    if (!serverKey) {
        console.error('CRITICAL: EXTENSION_API_KEY is not configured on the server');
        return res.status(500).json({ error: 'Internal server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    try {
        // Use SHA-256 hashing to ensure both buffers have the same length for timingSafeEqual
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const serverKeyHash = crypto.createHash('sha256').update(serverKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, serverKeyHash)) {
            return next();
        }
    } catch (err) {
        console.error('Extension Auth Error:', err.message);
    }

    res.status(403).json({ error: 'Invalid API key' });
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
