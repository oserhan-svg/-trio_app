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

        // Bulk aggregations to avoid N+1 query problem
        const [typeCounts, monthlyProps, interactionCounts, completedTasks] = await Promise.all([
            // 1. Group by assigned_user_id and listing_type
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Interactions this month (using $queryRaw for JOIN aggregation)
            consultantIds.length > 0 ? prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth} AND c.consultant_id IN (${consultantIds})
                GROUP BY c.consultant_id
            ` : Promise.resolve([]),
            // 4. Completed tasks this month
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Helper maps for O(1) lookup
        const getCount = (arr, userId, key, matchKey = 'assigned_user_id') => {
            const item = arr.find(x => x[matchKey] === userId && (key ? x.listing_type === key : true));
            return item ? (item._count?.id || item.count || 0) : 0;
        };

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: getCount(typeCounts, c.id, 'sale'),
                active_rent: getCount(typeCounts, c.id, 'rent'),
                new_portfolio_monthly: getCount(monthlyProps, c.id),
                interactions_monthly: interactionCounts.find(x => x.consultant_id === c.id)?.count || 0,
                completed_tasks_monthly: getCount(completedTasks, c.id, null, 'user_id')
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

        // Bulk fetch monthly stats using SQL for grouping
        const [propertyStats, interactionStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startDate}
                GROUP BY month
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startDate}
                GROUP BY month
            `
        ]);

        const monthlyStats = months.map(m => {
            const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            return {
                name: m.name,
                portföy: propertyStats.find(s => s.month === monthKey)?.count || 0,
                etkileşim: interactionStats.find(s => s.month === monthKey)?.count || 0
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
