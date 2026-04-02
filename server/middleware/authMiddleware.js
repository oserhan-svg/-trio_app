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
    const extensionApiKey = req.headers['x-extension-api-key'];
    const serverApiKey = process.env.EXTENSION_API_KEY;

    if (!serverApiKey) {
        console.error('CRITICAL: EXTENSION_API_KEY is not defined in environment variables.');
        return res.status(500).json({ error: 'Extension access is currently disabled' });
    }

    if (!extensionApiKey) {
        return res.status(401).json({ error: 'Extension API key required' });
    }

    // Use constant-time comparison to prevent timing attacks
    // We hash both keys to ensure they are the same length before comparison
    const extensionKeyHash = crypto.createHash('sha256').update(extensionApiKey).digest();
    const serverKeyHash = crypto.createHash('sha256').update(serverApiKey).digest();

    if (extensionKeyHash.length === serverKeyHash.length && crypto.timingSafeEqual(extensionKeyHash, serverKeyHash)) {
        next();
    } else {
        console.warn(`[AUTH] Unauthorized extension access attempt from: ${req.ip}`);
        res.status(401).json({ error: 'Invalid Extension API key' });
    }
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
