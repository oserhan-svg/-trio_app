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
 * Middleware for Chrome Extension authentication using API Key
 * Fail-secure: returns 500 if server key is not configured
 */
const extensionAuth = (req, res, next) => {
    const serverKey = process.env.EXTENSION_API_KEY;
    const clientKey = req.headers['x-extension-api-key'];

    if (!serverKey) {
        console.error('🛡️ [SECURITY] CRITICAL: EXTENSION_API_KEY is not defined in environment variables.');
        return res.status(500).json({ error: 'Extension access is currently disabled on the server.' });
    }

    if (!clientKey || clientKey !== serverKey) {
        console.warn(`🛡️ [SECURITY] Unauthorized Extension Access Attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid or missing Extension API Key' });
    }

    next();
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
