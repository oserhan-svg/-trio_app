const prisma = require('../db');

exports.getDashboardStats = async (req, res) => {
    try {
        // [OPTIMIZATION] Consolidate multiple counts into a single raw SQL query.
        // Reduces database round-trips from 5 to 1.
        const counts = await prisma.$queryRaw`
            SELECT
                COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE url LIKE '%sahibinden.com%')::int as sahibinden,
                COUNT(*) FILTER (WHERE url LIKE '%hepsiemlak.com%' OR url LIKE '%hemlak.com%')::int as hepsiemlak,
                COUNT(*) FILTER (WHERE url LIKE '%emlakjet.com%')::int as emlakjet,
                COUNT(*) FILTER (WHERE "assigned_user_id" IS NOT NULL)::int as assigned
            FROM "properties"
        `;

        const { total, sahibinden, hepsiemlak, emlakjet, assigned } = counts[0];

        res.json({
            stats: {
                totalProperties: total,
                sources: [
                    { name: 'Sahibinden', count: sahibinden, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { name: 'Hepsiemlak', count: hepsiemlak, color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'Emlakjet', count: emlakjet, color: 'text-green-600', bg: 'bg-green-50' },
                    { name: 'Diğer', count: total - (sahibinden + hepsiemlak + emlakjet), color: 'text-gray-600', bg: 'bg-gray-50' }
                ],
                assignedCount: assigned,
                pendingCount: total - assigned
            }
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
