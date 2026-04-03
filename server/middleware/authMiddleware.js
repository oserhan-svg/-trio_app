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
 * 🛡️ Sentinel: Secure Authentication for Chrome Extension
 * Uses constant-time comparison and SHA-256 hashing to prevent timing attacks.
 */
const extensionAuth = (req, res, next) => {
    const apiKey = req.headers['x-extension-api-key'];
    const serverKey = process.env.EXTENSION_API_KEY;

    if (!serverKey) {
        console.error('❌ [SECURITY] EXTENSION_API_KEY is not defined in environment variables.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API key required' });
    }

    try {
        // Hash both keys to ensure fixed length for timingSafeEqual
        const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest();
        const hashedServerKey = crypto.createHash('sha256').update(serverKey).digest();

        if (crypto.timingSafeEqual(hashedApiKey, hashedServerKey)) {
            next();
        } else {
            console.warn(`⚠️ [SECURITY] Unauthorized extension access attempt from ${req.ip}`);
            res.status(403).json({ error: 'Invalid Extension API key' });
        }
    } catch (error) {
        console.error('❌ [SECURITY] Extension auth error:', error.message);
        res.status(500).json({ error: 'Internal security error' });
    }
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
