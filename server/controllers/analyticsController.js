const prisma = require('../db');
const analyticsService = require('../services/analyticsService');
const pipelineService = require('../services/pipelineService');
const { jsonBigInt } = require('../utils/responseHelper');

const getStats = async (req, res) => {
    try {
        console.log('📊 Starting Optimized Analytics Calculation...');
        const start = Date.now();

        // ⚡ Bolt Optimization: Parallelize independent data fetching and consolidate DB counts
        const [statsMap, supplyDemand, countsResult] = await Promise.all([
            analyticsService.getNeighborhoodStatsMap(),
            analyticsService.getSupplyDemandStats(),
            // Consolidate multiple sequential counts into a single raw SQL query to reduce round-trips
            prisma.$queryRaw`
                SELECT
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE "url" LIKE '%sahibinden.com%')::int as sahibinden,
                    COUNT(*) FILTER (WHERE "url" LIKE '%hepsiemlak.com%' OR "url" LIKE '%hemlak.com%')::int as hepsiemlak,
                    COUNT(*) FILTER (WHERE "url" LIKE '%emlakjet.com%')::int as emlakjet,
                    COUNT(*) FILTER (WHERE "assigned_user_id" IS NOT NULL)::int as assigned
                FROM "properties"
            `
        ]);

        const stats = countsResult[0] || { total: 0, sahibinden: 0, hepsiemlak: 0, emlakjet: 0, assigned: 0 };
        const { total: totalProperties, sahibinden: sahibindenCount, hepsiemlak: hepsiemlakCount, emlakjet: emlakjetCount, assigned: assignedCount } = stats;

        console.log(`✅ Analytics calculated in ${Date.now() - start}ms`);

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
