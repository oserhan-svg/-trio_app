const prisma = require('../db');
const analyticsService = require('../services/analyticsService');

exports.getDashboardStats = async (req, res) => {
    try {
        // Optimized: Fetch all counts in a single DB round-trip via AnalyticsService
        const counts = await analyticsService.getGlobalCounts();

        res.json({
            stats: {
                totalProperties: counts.total,
                sources: [
                    { name: 'Sahibinden', count: counts.sahibinden, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { name: 'Hepsiemlak', count: counts.hepsiemlak, color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'Emlakjet', count: counts.emlakjet, color: 'text-green-600', bg: 'bg-green-50' },
                    { name: 'Diğer', count: counts.total - (counts.sahibinden + counts.hepsiemlak + counts.emlakjet), color: 'text-gray-600', bg: 'bg-gray-50' }
                ],
                assignedCount: counts.assigned,
                pendingCount: counts.total - counts.assigned
            }
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
