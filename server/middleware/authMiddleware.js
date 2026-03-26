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
 * Middleware for Chrome Extension authentication using API Key
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const serverKey = process.env.EXTENSION_API_KEY;

    if (!serverKey) {
        console.error('❌ EXTENSION_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Internal server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        // Use SHA-256 for a fixed-length comparison to mitigate timing attacks
        const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest();
        const hashedServerKey = crypto.createHash('sha256').update(serverKey).digest();

        if (crypto.timingSafeEqual(hashedApiKey, hashedServerKey)) {
            next();
        } else {
            console.warn(`⚠️ [SECURITY] Invalid Extension API Key attempt from ${req.ip}`);
            res.status(403).json({ error: 'Invalid API Key' });
        }
    } catch (error) {
        console.error('Extension Auth Error:', error);
        res.status(500).json({ error: 'Authentication processing error' });
    }
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
