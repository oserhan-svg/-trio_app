const aiLearningService = require('../services/aiLearningService');
const prisma = require('../db');
const Groq = require('groq-sdk');

const submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_helpful, comment } = req.body;

        const updated = await prisma.aIRecommendation.update({
            where: { id: parseInt(id) },
            data: {
                feedback: {
                    is_helpful,
                    comment,
                    submitted_at: new Date().toISOString()
                }
            }
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Feedback Error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};

const runManualOptimization = async (req, res) => {
    try {
        const result = await aiLearningService.runOptimization();
        res.json(result);
    } catch (error) {
        console.error('Manual Optimization Error:', error);
        res.status(500).json({ error: 'Optimization failed', details: error.message });
    }
};

const getLearnedInsights = async (req, res) => {
    try {
        const insights = await prisma.aIKnowledge.findMany({
            where: {
                OR: [
                    { category: 'regional' },
                    { category: 'instruction' }
                ]
            },
            orderBy: { created_at: 'desc' },
            take: 20
        });
        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
};

const approveInsight = async (req, res) => {
    try {
        const { id } = req.params;
        const insight = await prisma.aIKnowledge.update({
            where: { id: parseInt(id) },
            data: { status: 'active' }
        });
        res.json(insight);
    } catch (error) {
        res.status(500).json({ error: 'Approval failed' });
    }
};

const deleteInsight = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.aIKnowledge.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Deletion failed' });
    }
};

const getAIStats = async (req, res) => {
    try {
        const marketService = require('../services/marketService');
        const [recommendations, leads, marketGaps, revenue, knowledgeStats, dealsCount] = await Promise.all([
            prisma.aIRecommendation.findMany({
                where: { feedback: { not: null } }
            }),
            prisma.aIRecommendation.findMany({
                where: {
                    recommendation: { contains: 'Yeni bir potansiyel müşteri' },
                    metadata: { not: null }
                }
            }),
            marketService.getMarketGaps(),
            marketService.getRevenueForecast(),
            prisma.aIKnowledge.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.deal.count({
                where: {
                    status: 'closed',
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            })
        ]);

        const totalFeedback = recommendations.length;
        const helpfulCount = recommendations.filter(r => r.feedback?.is_helpful).length;
        const helpfulRate = totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0;

        // Interaction stats for agents
        const totalInteractions = await prisma.interaction.count({
            where: { content: { contains: '[AI]' } } // Identifying AI-recorded interactions
        });

        // Calculate total and active rules
        const totalRules = knowledgeStats.reduce((sum, stat) => sum + stat._count, 0);
        const activeRules = knowledgeStats.find(s => s.status === 'active')?._count || 0;

        // Get last optimization timestamp (approximate from most recent active knowledge)
        const lastKnowledge = await prisma.aIKnowledge.findFirst({
            where: { status: 'active', category: { in: ['instruction', 'fix'] } },
            orderBy: { created_at: 'desc' },
            select: { created_at: true }
        });

        res.json({
            totalRules,
            activeRules,
            successfulDeals: dealsCount,
            lastOptimization: lastKnowledge?.created_at,
            performance: {
                totalFeedback,
                helpfulCount,
                helpfulRate: helpfulRate.toFixed(1)
            },
            leadQuality: leads.map(l => ({
                score: l.metadata?.seriousnessScore,
                date: l.created_at
            })),
            automation: {
                totalInteractions
            },
            marketIntelligence: {
                gaps: marketGaps,
                revenue
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch AI stats' });
    }
};

module.exports = {
    runManualOptimization,
    getLearnedInsights,
    approveInsight,
    deleteInsight,
    submitFeedback,
    getAIStats
};
