const jwt = require('jsonwebtoken');
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
 * Secure middleware for Chrome Extension endpoints.
 * Uses SHA-256 for constant-time comparison against EXTENSION_API_KEY.
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.EXTENSION_API_KEY;

    if (!serverApiKey) {
        console.error('❌ EXTENSION_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key required' });
    }

    try {
        const crypto = require('crypto');

        // Use SHA-256 to hash both keys to fixed length
        // This mitigates length-based timing leaks and handles different input lengths safely
        const hash = (key) => crypto.createHash('sha256').update(key).digest();
        const clientHash = hash(apiKey);
        const serverHash = hash(serverApiKey);

        if (crypto.timingSafeEqual(clientHash, serverHash)) {
            return next();
        }

        return res.status(401).json({ error: 'Invalid API Key' });
    } catch (error) {
        console.error('Extension Auth Error:', error);
        return res.status(500).json({ error: 'Authentication processing error' });
    }
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
