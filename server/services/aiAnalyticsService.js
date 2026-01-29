const prisma = require('../db');

class AIAnalyticsService {

    async trackAIAction(data) {
        // Track any AI feature usage
        const { featureName, userId, clientId, propertyId, dealId, actionType, wasAccepted, conversionValue, timeSavedMins, metadata } = data;

        try {
            await prisma.aIImpactMetric.create({
                data: {
                    feature_name: featureName,
                    user_id: userId,
                    client_id: clientId,
                    property_id: propertyId,
                    deal_id: dealId,
                    action_type: actionType,
                    was_accepted: wasAccepted || false,
                    conversion_value: conversionValue,
                    time_saved_mins: timeSavedMins,
                    metadata: metadata || {}
                }
            });
        } catch (error) {
            console.error('AI Analytics tracking error:', error);
        }
    }

    async getROIDashboardData(dateRange = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);

        // 1. Feature Usage Stats
        const featureUsage = await prisma.aIImpactMetric.groupBy({
            by: ['feature_name'],
            where: { created_at: { gte: startDate } },
            _count: { id: true },
            _sum: {
                conversion_value: true,
                time_saved_mins: true
            }
        });

        // 2. Acceptance Rate by Feature
        const acceptanceRates = await prisma.aIImpactMetric.groupBy({
            by: ['feature_name'],
            where: { created_at: { gte: startDate } },
            _avg: { was_accepted: true },
            _count: { id: true }
        });

        // 3. Deals Influenced by AI
        const aiInfluencedDeals = await prisma.aIImpactMetric.count({
            where: {
                created_at: { gte: startDate },
                deal_id: { not: null },
                conversion_value: { gt: 0 }
            }
        });

        // 4. Total Time Saved
        const timeSaved = await prisma.aIImpactMetric.aggregate({
            where: { created_at: { gte: startDate } },
            _sum: { time_saved_mins: true }
        });

        // 5. Revenue Attribution
        const totalRevenue = await prisma.aIImpactMetric.aggregate({
            where: { created_at: { gte: startDate } },
            _sum: { conversion_value: true }
        });

        // 6. Top Performing Consultants (AI-assisted)
        const topUsers = await prisma.aIImpactMetric.groupBy({
            by: ['user_id'],
            where: {
                created_at: { gte: startDate },
                was_accepted: true
            },
            _count: { id: true },
            _sum: { conversion_value: true },
            orderBy: { _sum: { conversion_value: 'desc' } },
            take: 5
        });

        return {
            featureUsage: featureUsage.map(f => ({
                feature: f.feature_name,
                uses: f._count.id,
                revenue: f._sum.conversion_value || 0,
                timeSaved: f._sum.time_saved_mins || 0
            })),
            acceptanceRates: acceptanceRates.map(a => ({
                feature: a.feature_name,
                acceptanceRate: (a._avg.was_accepted * 100).toFixed(1),
                totalActions: a._count.id
            })),
            summary: {
                aiInfluencedDeals,
                totalTimeSaved: timeSaved._sum.time_saved_mins || 0,
                totalRevenue: totalRevenue._sum.conversion_value || 0,
                avgDealSize: aiInfluencedDeals > 0 ? (totalRevenue._sum.conversion_value / aiInfluencedDeals) : 0
            },
            topUsers: topUsers.filter(u => u.user_id).map(u => ({
                userId: u.user_id,
                acceptedActions: u._count.id,
                revenue: u._sum.conversion_value || 0
            }))
        };
    }

    async getFeatureComparison() {
        // Compare performance of different AI features
        const features = [
            'semantic_match',
            'negotiation_assist',
            'proactive_pitch',
            'market_analysis',
            'content_generation'
        ];

        const comparison = [];
        for (const feature of features) {
            const metrics = await prisma.aIImpactMetric.aggregate({
                where: { feature_name: feature },
                _count: { id: true },
                _avg: { was_accepted: true },
                _sum: {
                    conversion_value: true,
                    time_saved_mins: true
                }
            });

            comparison.push({
                feature,
                totalUses: metrics._count.id,
                acceptanceRate: ((metrics._avg.was_accepted || 0) * 100).toFixed(1),
                revenue: metrics._sum.conversion_value || 0,
                timeSaved: metrics._sum.time_saved_mins || 0,
                roi: metrics._sum.conversion_value ?
                    (metrics._sum.conversion_value / (metrics._count.id * 10)).toFixed(2) : 0  // Rough ROI calc
            });
        }

        return comparison.sort((a, b) => b.revenue - a.revenue);
    }
}

module.exports = new AIAnalyticsService();
