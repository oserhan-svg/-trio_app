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
    const secretKey = process.env.EXTENSION_API_KEY;

    if (!secretKey) {
        console.error('CRITICAL: EXTENSION_API_KEY is not defined in the environment.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey) {
        return res.status(401).json({ error: 'Extension API Key required' });
    }

    try {
        // Hash both to ensure they have the same length for timingSafeEqual
        const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest();
        const hashedSecretKey = crypto.createHash('sha256').update(secretKey).digest();

        if (crypto.timingSafeEqual(hashedApiKey, hashedSecretKey)) {
            return next();
        }
    } catch (error) {
        console.error('Error during extension authentication:', error);
    }

    res.status(401).json({ error: 'Invalid Extension API Key' });
};

module.exports = { authenticateToken, authorizeRole, isAdmin, extensionAuth };
