const prisma = require('../db');
const analyticsService = require('../services/analyticsService');
const pipelineService = require('../services/pipelineService');
const { jsonBigInt } = require('../utils/responseHelper');

const getStats = async (req, res) => {
    try {
        console.log('📊 Starting Analytics Calculation...');
        const start = Date.now();

        // [PERFORMANCE] Parallelize independent data fetching
        const [statsMap, supplyDemand, countsData] = await Promise.all([
            analyticsService.getNeighborhoodStatsMap(),
            analyticsService.getSupplyDemandStats(),
            // [PERFORMANCE] Consolidated all property counts into a single raw SQL query.
            // Uses SUM(CASE WHEN...) for better portability across different SQL dialects.
            prisma.$queryRaw`
                SELECT
                    COUNT(*) as "total",
                    SUM(CASE WHEN assigned_user_id IS NOT NULL THEN 1 ELSE 0 END) as "assigned",
                    SUM(CASE WHEN url LIKE '%sahibinden.com%' THEN 1 ELSE 0 END) as "sahibinden",
                    SUM(CASE WHEN url LIKE '%hepsiemlak.com%' OR url LIKE '%hemlak.com%' THEN 1 ELSE 0 END) as "hepsiemlak",
                    SUM(CASE WHEN url LIKE '%emlakjet.com%' THEN 1 ELSE 0 END) as "emlakjet"
                FROM properties
            `
        ]);

        const counts = countsData[0];
        const totalProperties = Number(counts.total || 0);
        const assignedCount = Number(counts.assigned || 0);
        const sahibindenCount = Number(counts.sahibinden || 0);
        const hepsiemlakCount = Number(counts.hepsiemlak || 0);
        const emlakjetCount = Number(counts.emlakjet || 0);

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
