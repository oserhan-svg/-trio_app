const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { generateStory } = require('../services/imageService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/story/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) }
        });

        if (!property) return res.status(404).json({ error: 'Property not found' });

        const imageBuffer = await generateStory(property);

        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

module.exports = router;
