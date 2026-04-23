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

        // BOLT OPTIMIZATION: Replace N+1 queries with bulk aggregations
        // Reduces query count from 1 + 5*N to 5 total queries
        const [listingTypeStats, newPortfolioStats, interactionStats, completedTasksStats] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
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
                WHERE i.date >= ${startOfMonth} AND c.consultant_id = ANY(${consultantIds})
                GROUP BY c.consultant_id
            `,
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Map results for O(1) lookup
        const listingMap = {};
        listingTypeStats.forEach(s => {
            if (!listingMap[s.assigned_user_id]) listingMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            listingMap[s.assigned_user_id][s.listing_type] = s._count.id;
        });

        const newPortfolioMap = Object.fromEntries(newPortfolioStats.map(s => [s.assigned_user_id, s._count.id]));
        const interactionMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const tasksMap = Object.fromEntries(completedTasksStats.map(s => [s.user_id, s._count.id]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: listingMap[c.id]?.sale || 0,
                active_rent: listingMap[c.id]?.rent || 0,
                new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                interactions_monthly: interactionMap[c.id] || 0,
                completed_tasks_monthly: tasksMap[c.id] || 0
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

        // BOLT OPTIMIZATION: Replace 6-month loop with 2 bulk aggregations using date_trunc
        const startOfRange = months[months.length - 1].start;

        const [monthlyProperties, monthlyInteractions] = await Promise.all([
            prisma.$queryRaw`
                SELECT date_trunc('month', created_at) as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startOfRange}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT date_trunc('month', i.date) as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startOfRange}
                GROUP BY 1
            `
        ]);

        // Use robust 'YYYY-MM' mapping to avoid timezone/offset issues with Date.getTime()
        const toKey = (d) => {
            const date = new Date(d);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        };

        const propMap = Object.fromEntries(monthlyProperties.map(p => [toKey(p.month), p.count]));
        const intMap = Object.fromEntries(monthlyInteractions.map(i => [toKey(i.month), i.count]));

        const monthlyStats = months.map(m => ({
            name: m.name,
            portföy: propMap[toKey(m.start)] || 0,
            etkileşim: intMap[toKey(m.start)] || 0
        }));

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
