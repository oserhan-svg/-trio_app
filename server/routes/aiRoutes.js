const express = require('express');
const router = express.Router();
const GroqService = require('../services/GroqService');
const CacheService = require('../services/CacheService');
const prisma = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * GET /api/ai/sessions
 * Get all AI sessions for the authenticated user
 */
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await prisma.aIChatSession.findMany({
            where: { user_id: req.user.id },
            orderBy: { updated_at: 'desc' }
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/sessions/:id
 * Get message history for a specific session
 */
router.get('/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const session = await prisma.aIChatSession.findUnique({
            where: {
                id: parseInt(req.params.id),
                user_id: req.user.id
            },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/process
 * Chat with Groq AI with session support
 */
router.post('/process', authenticateToken, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const result = await GroqService.chat(message, sessionId, req.user.id);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        res.json({
            answer: result.content,
            sessionId: result.sessionId,
            toolCall: result.toolCall,
            properties: result.properties,
            intent: 'groq.chat'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/train
 * Add new training data (NLP Manager)
 */
router.post('/train', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { type, input, output } = req.body;
        const TrainableAIService = require('../services/TrainableAIService');
        await TrainableAIService.addTrainingData(type, input, output);
        res.json({ message: 'Training data added and model retrained.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/knowledge
 * Add reliable expert knowledge (DB)
 */
router.post('/knowledge', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const knowledge = await prisma.aIKnowledge.create({
            data: { title, content, category }
        });
        res.json(knowledge);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/knowledge
 * List all knowledge entries
 */
router.get('/knowledge', authenticateToken, async (req, res) => {
    try {
        const { category } = req.query;
        const where = { status: 'active' };

        if (category) {
            const categories = category.split(',');
            where.category = { in: categories };
        }

        const items = await prisma.aIKnowledge.findMany({
            where,
            orderBy: { updated_at: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/stats
 * Get analytics for the dashboard
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const cacheKey = 'ai_stats:global';

        const stats = await CacheService.getOrSet(cacheKey, async () => {
            const [totalSessions, totalMessages, totalKnowledge] = await Promise.all([
                prisma.aIChatSession.count(),
                prisma.aIChatMessage.count(),
                prisma.aIKnowledge.count()
            ]);

            const knowledgeStats = await prisma.aIKnowledge.groupBy({
                by: ['category'],
                _count: true
            });

            const recentLearned = await prisma.aIKnowledge.findMany({
                where: { title: { contains: 'Oto-Ders' } },
                take: 3,
                orderBy: { created_at: 'desc' }
            });

            return {
                totalSessions,
                totalMessages,
                totalKnowledge,
                knowledgeStats: knowledgeStats.reduce((acc, curr) => ({ ...acc, [curr.category]: curr._count }), {}),
                recentLearned
            };
        }, 60); // 60 seconds cache

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/proposals
 * List all proposed knowledge entries
 */
router.get('/proposals', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const items = await prisma.aIKnowledge.findMany({
            where: { status: 'proposed' },
            orderBy: { created_at: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/proposals/:id/approve
 * Approve a proposed knowledge entry
 */
router.post('/proposals/:id/approve', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const item = await prisma.aIKnowledge.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status: 'active',
                title: req.body.title || undefined, // Allow editing title on approval
                content: req.body.content || undefined
            }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/proposals/:id/reject
 * Reject a proposed knowledge entry
 */
router.post('/proposals/:id/reject', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const item = await prisma.aIKnowledge.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'rejected' }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const DeveloperBotService = require('../services/DeveloperBotService');

/**
 * GET /api/ai/bot/status
 * Get Developer Bot status and logs
 */
router.get('/bot/status', authenticateToken, async (req, res) => {
    try {
        const status = await DeveloperBotService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/bot/trigger
 * Trigger a specific bot action
 */
router.post('/bot/trigger', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { action } = req.body;
        let result;

        if (action === 'test') {
            result = await DeveloperBotService.runContinuousTests();
        } else if (action === 'audit') {
            result = await DeveloperBotService.autoAudit();
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/bot/test-results
 * Get all test results
 */
router.get('/bot/test-results', authenticateToken, async (req, res) => {
    try {
        const results = await prisma.aITestResult.findMany({
            include: { test_case: true },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/generate-caption
 * Generate social media caption for a property
 */
router.post('/generate-caption', authenticateToken, async (req, res) => {
    try {
        const { propertyId, platform } = req.body;
        const property = await prisma.property.findUnique({ where: { id: parseInt(propertyId) } });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const caption = await GroqService.generateSocialCaption(property, platform);
        res.json({ caption });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




/**
 * GET /api/ai/tests
 * List all test cases
 */
router.get('/tests', authenticateToken, async (req, res) => {
    try {
        const tests = await prisma.aITestCase.findMany({
            orderBy: { created_at: 'desc' }
        });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/tests
 * Create a new test case
 */
router.post('/tests', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { input_message, expected_intent, expected_keywords, is_golden } = req.body;
        const testCase = await prisma.aITestCase.create({
            data: {
                input_message,
                expected_intent,
                expected_keywords: Array.isArray(expected_keywords) ? expected_keywords : (expected_keywords ? expected_keywords.split(',').map(k => k.trim()) : []),
                is_golden: is_golden || false,
                category: 'manual'
            }
        });
        res.json(testCase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/ai/tests/:id
 * Delete a test case
 */
router.delete('/tests/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await prisma.aITestCase.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Test case deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
