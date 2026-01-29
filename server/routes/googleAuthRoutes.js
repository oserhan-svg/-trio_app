const express = require('express');
const router = express.Router();
const googleCalendarService = require('../services/googleCalendarService');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Initiate OAuth flow
router.get('/google', authenticateToken, (req, res) => {
    console.log('--- ROUTE DEBUG: /api/calendar/google called for user:', req.user.id);
    const url = googleCalendarService.getAuthUrl(req.user.id);
    console.log('--- ROUTE DEBUG: Returning URL to client:', url);
    res.json({ url });
});

// OAuth Callback
router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const userId = parseInt(state);

    if (!code || !userId) {
        return res.status(400).send('Invalid request');
    }

    try {
        const tokens = await googleCalendarService.getTokens(code);

        await prisma.user.update({
            where: { id: userId },
            data: {
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            }
        });

        // Redirect back to the frontend
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?google_connected=true`);
    } catch (error) {
        console.error('OAuth Callback Error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Check Connection Status
router.get('/google/status', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { google_refresh_token: true }
        });
        res.json({ connected: !!user.google_refresh_token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
