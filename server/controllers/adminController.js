const prisma = require('../db');

exports.getDashboardStats = async (req, res) => {
    try {
        // ⚡ Bolt: Execute independent queries concurrently using Promise.all to prevent sequential latency bottlenecks
        const [
            totalProperties,
            sahibindenCount,
            hepsiemlakCount,
            emlakjetCount,
            assignedCount
        ] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({ where: { url: { contains: 'sahibinden.com' } } }),
            prisma.property.count({
                where: {
                    OR: [
                        { url: { contains: 'hepsiemlak.com' } },
                        { url: { contains: 'hemlak.com' } }
                    ]
                }
            }),
            prisma.property.count({ where: { url: { contains: 'emlakjet.com' } } }),
            prisma.property.count({ where: { assigned_user_id: { not: null } } })
        ]);

        // 4. Duplicate / similar (Approximation for 'Mükerrer')
        // Ideally we check for same external_id or similar title+price
        // For now, let's just count properties sharing an external_id if strictly unique,
        // but since external_id is unique in schema, maybe we count properties with same group_id > 1?
        // Let's use simplified logic: Properties scraped today vs total? 
        // Or simply "Pending Assignments"
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
