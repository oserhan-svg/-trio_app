const prisma = require('../db');

exports.getConsultantPerformance = async (req, res) => {
    try {
        const consultants = await prisma.user.findMany({
            where: { role: 'consultant' },
            select: {
                id: true,
                email: true,
                _count: {
                    select: {
                        clients: true,
                        agenda_items: true,
                        properties: true
                    }
                },
                name: true
            }
        });

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const consultantIds = consultants.map(c => c.id);

        // Bulk Fetch Optimization (Replace N+1 counts with O(1) bulk aggregations)
        const [saleCounts, rentCounts, newPortfolioCounts, interactionCounts, completedTaskCounts] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'sale' },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'rent' },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds}) AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Helper to map results efficiently
        const getCount = (list, userId) => {
            const entry = list.find(item => item.assigned_user_id === userId || item.consultant_id === userId || item.user_id === userId);
            return Number(entry?._count?.id || entry?.count || 0);
        };

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: getCount(saleCounts, c.id),
                active_rent: getCount(rentCounts, c.id),
                new_portfolio_monthly: getCount(newPortfolioCounts, c.id),
                interactions_monthly: getCount(interactionCounts, c.id),
                completed_tasks_monthly: getCount(completedTaskCounts, c.id)
            }
        }));

        res.json(performanceData);
    } catch (error) {
        console.error('Performance API Error:', error);
        res.status(500).json({ message: 'Performans verileri alınamadı.' });
    }
};

exports.getConsultantDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const consultantId = parseInt(id);

        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                name: d.toLocaleString('tr-TR', { month: 'long' }),
                month: d.getMonth(),
                year: d.getFullYear(),
                start: new Date(d.getFullYear(), d.getMonth(), 1),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
            });
        }

        const startDate = months[0].start;

        // Optimized bulk fetch for monthly stats
        const [propStats, intStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month_key, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startDate}
                GROUP BY month_key
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month_key, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startDate}
                GROUP BY month_key
            `
        ]);

        const monthlyStats = months.map(m => {
            const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            const pCount = propStats.find(r => r.month_key === key)?.count || 0;
            const iCount = intStats.find(r => r.month_key === key)?.count || 0;
            return {
                name: m.name,
                portföy: pCount,
                etkileşim: iCount
            };
        });

        // Client distribution
        const clientStatusDist = await prisma.client.groupBy({
            by: ['status'],
            where: { consultant_id: consultantId },
            _count: { id: true }
        });

        // Recent activities
        const recentInteractions = await prisma.interaction.findMany({
            where: { client: { consultant_id: consultantId } },
            orderBy: { date: 'desc' },
            take: 10,
            include: { client: { select: { name: true } } }
        });

        res.json({
            monthlyStats,
            clientStatusDist: clientStatusDist.map(d => ({ name: d.status, value: d._count.id })),
            recentInteractions
        });
    } catch (error) {
        console.error('Consultant Detail API Error:', error);
        res.status(500).json({ message: 'Detay verileri alınamadı.' });
    }
};
