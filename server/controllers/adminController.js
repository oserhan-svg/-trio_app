const prisma = require('../db');
const analyticsService = require('../services/analyticsService');

exports.getDashboardStats = async (req, res) => {
    try {
        // [OPTIMIZATION] Using getGlobalCounts to reduce 5 count queries to 1
        const { totalProperties, assignedCount, sahibindenCount, hepsiemlakCount, emlakjetCount } = await analyticsService.getGlobalCounts();

        const pendingCount = totalProperties - assignedCount;

        res.json({
            stats: {
                totalProperties,
                sources: [
                    { name: 'Sahibinden', count: sahibindenCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { name: 'Hepsiemlak', count: hepsiemlakCount, color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'Emlakjet', count: emlakjetCount, color: 'text-green-600', bg: 'bg-green-50' },
                    { name: 'Diğer', count: totalProperties - (sahibindenCount + hepsiemlakCount + emlakjetCount), color: 'text-gray-600', bg: 'bg-gray-50' }
                ],
                assignedCount,
                pendingCount
            }
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
