const { getMarketStats, getNeighborhoodStatsMap, getSupplyDemandStats } = require('../services/analyticsService');

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

        const jsonString = JSON.stringify(responseData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        res.setHeader('Content-Type', 'application/json');
        res.send(jsonString);
    } catch (error) {
        res.status(500).json({ error: 'Error calculating stats: ' + error.message });
    }
};

module.exports = { getStats };
