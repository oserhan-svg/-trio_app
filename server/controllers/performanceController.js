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

        // BOLT OPTIMIZATION: Use bulk aggregations instead of N+1 iterative counts
        // This reduces query count from 1 + 5N to just 5 total queries.
        const [
            propertyCounts,
            newPortfolioCounts,
            interactionCounts,
            completedTasksCounts
        ] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultants.map(c => c.id) } },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultants.map(c => c.id) },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            prisma.$queryRaw`
                SELECT c.consultant_id as "consultantId", COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ANY(${consultants.map(c => c.id)}) AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultants.map(c => c.id) },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            })
        ]);

        // Map results for O(1) lookups
        const propertyMap = new Map();
        propertyCounts.forEach(p => {
            const key = `${p.assigned_user_id}_${p.listing_type}`;
            propertyMap.set(key, p._count.id);
        });

        const newPortfolioMap = new Map(newPortfolioCounts.map(p => [p.assigned_user_id, p._count.id]));
        const interactionMap = new Map(interactionCounts.map(i => [i.consultantId, i.count]));
        const completedTasksMap = new Map(completedTasksCounts.map(t => [t.user_id, t._count.id]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propertyMap.get(`${c.id}_sale`) || 0,
                active_rent: propertyMap.get(`${c.id}_rent`) || 0,
                new_portfolio_monthly: newPortfolioMap.get(c.id) || 0,
                interactions_monthly: interactionMap.get(c.id) || 0,
                completed_tasks_monthly: completedTasksMap.get(c.id) || 0
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

        // BOLT OPTIMIZATION: Bulk fetch monthly stats using PostgreSQL date_trunc
        // This replaces the 6x2 iterative queries with just 2 bulk aggregations.
        const [bulkProperties, bulkInteractions] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${months[0].start}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(date_trunc('month', i.date), 'YYYY-MM') as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${months[0].start}
                GROUP BY 1
            `
        ]);

        const propMonthMap = new Map(bulkProperties.map(p => [p.month, p.count]));
        const intMonthMap = new Map(bulkInteractions.map(i => [i.month, i.count]));

        const monthlyStats = months.map(m => {
            const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            return {
                name: m.name,
                portföy: propMonthMap.get(monthKey) || 0,
                etkileşim: intMonthMap.get(monthKey) || 0
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
