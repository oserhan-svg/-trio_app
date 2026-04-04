const prisma = require('../db');

exports.getDashboardStats = async (req, res) => {
    try {
        // ⚡ Bolt Optimization: Use a single raw SQL query with FILTER to consolidate multiple counts.
        // This reduces database round-trips from 5 down to 1.
        const counts = await prisma.$queryRaw`
            SELECT
                COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE "assigned_user_id" IS NOT NULL)::int as assigned,
                COUNT(*) FILTER (WHERE "url" LIKE '%sahibinden.com%')::int as sahibinden,
                COUNT(*) FILTER (WHERE "url" LIKE '%hepsiemlak.com%' OR "url" LIKE '%hemlak.com%')::int as hepsiemlak,
                COUNT(*) FILTER (WHERE "url" LIKE '%emlakjet.com%')::int as emlakjet
            FROM "properties"
        `;

        const statsRow = counts[0] || { total: 0, assigned: 0, sahibinden: 0, hepsiemlak: 0, emlakjet: 0 };
        const totalProperties = statsRow.total;
        const assignedCount = statsRow.assigned;
        const sahibindenCount = statsRow.sahibinden;
        const hepsiemlakCount = statsRow.hepsiemlak;
        const emlakjetCount = statsRow.emlakjet;
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
