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

const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-extension-api-key'];
    const expectedKey = process.env.EXTENSION_API_KEY;

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API key required' });
    }

    if (!expectedKey) {
        console.error('EXTENSION_API_KEY is not set in environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Use timing-safe comparison by hashing both keys
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
    const expectedKeyHash = crypto.createHash('sha256').update(expectedKey).digest();

    if (apiKeyHash.length === expectedKeyHash.length &&
        crypto.timingSafeEqual(apiKeyHash, expectedKeyHash)) {
        return next();
    }

    console.warn(`Unauthorized extension access attempt from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Invalid Extension API key' });
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
