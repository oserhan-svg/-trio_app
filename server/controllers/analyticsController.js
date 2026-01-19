const prisma = require('../db');
const { getNeighborhoodStatsMap, getSupplyDemandStats } = require('../services/analyticsService');
const { jsonBigInt } = require('../utils/responseHelper');

const getStats = async (req, res) => {
    try {
        const statsMap = await getNeighborhoodStatsMap();
        const supplyDemand = await getSupplyDemandStats();

        const totalProperties = await prisma.property.count();
        const responseData = {
            totalProperties,
            marketStats: statsMap._heatmapData,
            supplyDemand
        };

        jsonBigInt(res, responseData);
    } catch (error) {
        res.status(500).json({ error: 'Error calculating stats: ' + error.message });
    }
};

module.exports = { getStats };
