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
    const apiKey = req.headers['x-api-key'], serverKey = process.env.EXTENSION_API_KEY;
    if (!serverKey) return res.status(500).json({ error: 'Server configuration error' });
    if (!apiKey) return res.status(401).json({ error: 'API Key required' });
    const h = k => crypto.createHash('sha256').update(k).digest();
    try {
        if (crypto.timingSafeEqual(h(apiKey), h(serverKey))) return next();
    } catch (e) {}
    res.status(401).json({ error: 'Invalid API Key' });
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
