const { getMarketStats, getNeighborhoodStatsMap } = require('../services/analyticsService');

const getStats = async (req, res) => {
    try {
        console.log('DEBUG: Analytics Request Received');
        const statsMap = await getNeighborhoodStatsMap();
        console.log('DEBUG: Analytics Map Calculated');

        const responseData = {
            marketStats: statsMap._heatmapData,
        };

        // Custom stringify for safety too
        const jsonString = JSON.stringify(responseData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        res.setHeader('Content-Type', 'application/json');
        res.send(jsonString);
    } catch (error) {
        console.error('DEBUG: Analytics Error:', error);
        res.status(500).json({ error: 'Error calculating stats: ' + error.message });
    }
};

module.exports = { getStats };
