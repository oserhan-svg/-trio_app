const prisma = require('../db');
const analyticsService = require('../services/analyticsService');
const pipelineService = require('../services/pipelineService');
const { jsonBigInt } = require('../utils/responseHelper');

const getStats = async (req, res) => {
    try {
        console.log('📊 Starting Analytics Calculation...');
        const start = Date.now();

        // [OPTIMIZATION] Parallelize independent data fetching tasks and consolidate counts
        // Reduces database round-trips from 7+ to 3 (statsMap, supplyDemand, and all counts in one SQL)
        const [statsMap, supplyDemand, counts] = await Promise.all([
            analyticsService.getNeighborhoodStatsMap(),
            analyticsService.getSupplyDemandStats(),
            prisma.$queryRaw`
                SELECT
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE url LIKE '%sahibinden.com%')::int as sahibinden,
                    COUNT(*) FILTER (WHERE url LIKE '%hepsiemlak.com%' OR url LIKE '%hemlak.com%')::int as hepsiemlak,
                    COUNT(*) FILTER (WHERE url LIKE '%emlakjet.com%')::int as emlakjet,
                    COUNT(*) FILTER (WHERE "assigned_user_id" IS NOT NULL)::int as assigned
                FROM "properties"
            `
        ]);

        const { total, sahibinden, hepsiemlak, emlakjet, assigned } = counts[0];
        console.log(`✅ Analytics calculated in ${Date.now() - start}ms`);

        const responseData = {
            totalProperties: total,
            marketStats: statsMap._heatmapData,
            supplyDemand,
            adminStats: {
                totalProperties: total,
                assignedCount: assigned,
                pendingCount: total - assigned,
                sources: [
                    { name: 'Sahibinden', count: sahibinden, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { name: 'Hepsiemlak', count: hepsiemlak, color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'Emlakjet', count: emlakjet, color: 'text-green-600', bg: 'bg-green-50' },
                    { name: 'Diğer', count: total - (sahibinden + hepsiemlak + emlakjet), color: 'text-gray-600', bg: 'bg-gray-50' }
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
