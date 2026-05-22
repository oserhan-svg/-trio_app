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
 * IDOR Middleware: Validates that the user has permission to access the client.
 * Consultants can only access clients assigned to them or unassigned clients.
 */
const checkClientOwnership = async (req, res, next) => {
    const prisma = require('../db');
    const clientId = req.params.id || req.params.clientId;
    const user = req.user;

    if (!clientId) return next();

    try {
        if (user.role === 'admin') return next();

        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            select: { consultant_id: true }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        if (client.consultant_id && client.consultant_id !== parseInt(user.id)) {
            return res.status(403).json({ error: 'Unauthorized: You do not have access to this client.' });
        }

        next();
    } catch (error) {
        console.error('Ownership Check Error:', error);
        res.status(500).json({ error: 'Authorization error' });
    }
};

module.exports = { authenticateToken, authorizeRole, isAdmin, checkClientOwnership };
