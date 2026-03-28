const prisma = require('../db');
const analyticsService = require('../services/analyticsService');
const pipelineService = require('../services/pipelineService');
const { jsonBigInt } = require('../utils/responseHelper');

const getStats = async (req, res) => {
    try {
        console.log('📊 Starting Analytics Calculation...');
        const start = Date.now();

        const statsMap = await analyticsService.getNeighborhoodStatsMap();
        console.log(`✅ statsMap calculated in ${Date.now() - start}ms`);

        const sStart = Date.now();
        const supplyDemand = await analyticsService.getSupplyDemandStats();
        console.log(`✅ supplyDemand calculated in ${Date.now() - sStart}ms`);

        // Admin-specific counts batched concurrently
        const [
            totalProperties,
            sahibindenCount,
            hepsiemlakCount,
            emlakjetCount,
            assignedCount
        ] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({
                where: { url: { contains: 'sahibinden.com' } }
            }),
            prisma.property.count({
                where: {
                    OR: [
                        { url: { contains: 'hepsiemlak.com' } },
                        { url: { contains: 'hemlak.com' } }
                    ]
                }
            }),
            prisma.property.count({
                where: { url: { contains: 'emlakjet.com' } }
            }),
            prisma.property.count({
                where: { assigned_user_id: { not: null } }
            })
        ]);

        const responseData = {
            totalProperties,
            marketStats: statsMap._heatmapData,
            supplyDemand,
            adminStats: {
                totalProperties,
                assignedCount,
                pendingCount: totalProperties - assignedCount,
                sources: [
                    { name: 'Sahibinden', count: sahibindenCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { name: 'Hepsiemlak', count: hepsiemlakCount, color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'Emlakjet', count: emlakjetCount, color: 'text-green-600', bg: 'bg-green-50' },
                    { name: 'Diğer', count: totalProperties - (sahibindenCount + hepsiemlakCount + emlakjetCount), color: 'text-gray-600', bg: 'bg-gray-50' }
                ]
            }
        };

        jsonBigInt(res, responseData);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Error calculating stats: ' + error.message });
    }
};

const getNeighborhoodStats = async (req, res) => {
    try {
        const { neighborhoods } = await analyticsService.getMarketStats();
        // Return average price per neighborhood (Normalizing per m2 to average property price ~100m2 for visualization)
        const data = neighborhoods.map(n => ({
            neighborhood: n.name,
            avgPrice: n.avgPricePerM2 * 100,
            count: n.count
        }));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDemandStats = async (req, res) => {
    try {
        const demandStats = await analyticsService.getDemandHeatmapData();
        res.json(demandStats);
    } catch (error) {
        console.error('Demand Analytics Error:', error);
        res.status(500).json({ error: 'Demand stats calculation failed' });
    }
};

const getPipelineSummary = async (req, res) => {
    try {
        const summary = await pipelineService.getPipelineSummary();
        jsonBigInt(res, summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { getMarketStats } = require('../services/analyticsService');

module.exports = { getStats, getDemandStats, getNeighborhoodStats, getPipelineSummary };
