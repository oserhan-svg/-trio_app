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

        const consultantIds = consultants.map(c => c.id);
        if (consultantIds.length === 0) return res.json([]);

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // BOLT OPTIMIZATION: Use bulk aggregations instead of N+1 queries in a loop
        const [listingStats, monthlyPortfolio, monthlyInteractions, monthlyTasks] = await Promise.all([
            // 1. Bulk count Sale/Rent listings
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. Bulk count New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            // 3. Bulk count Interactions (Requires JOIN, using $queryRaw)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ANY(${consultantIds})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Bulk count Completed Agenda tasks
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultantIds },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            })
        ]);

        // Map bulk results for O(1) lookup
        const listingMap = {}; // { userId: { sale: 0, rent: 0 } }
        listingStats.forEach(s => {
            if (!listingMap[s.assigned_user_id]) listingMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            listingMap[s.assigned_user_id][s.listing_type] = s._count.id;
        });

        const portfolioMap = Object.fromEntries(monthlyPortfolio.map(p => [p.assigned_user_id, p._count.id]));
        const interactionMap = Object.fromEntries(monthlyInteractions.map(i => [i.consultant_id, i.count]));
        const tasksMap = Object.fromEntries(monthlyTasks.map(t => [t.user_id, t._count.id]));

        const performanceData = consultants.map((c) => {
            const stats = listingMap[c.id] || { sale: 0, rent: 0 };
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: stats.sale || 0,
                    active_rent: stats.rent || 0,
                    new_portfolio_monthly: portfolioMap[c.id] || 0,
                    interactions_monthly: interactionMap[c.id] || 0,
                    completed_tasks_monthly: tasksMap[c.id] || 0
                }
            };
        });

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

        // BOLT OPTIMIZATION: Replace 12 queries with 2 bulk raw queries
        const sixMonthsAgo = months[months.length - 1].start; // Earliest start date
        const [propStats, intStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT date_trunc('month', created_at) as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId}
                AND created_at >= ${months[0].start}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT date_trunc('month', i.date) as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId}
                AND i.date >= ${months[0].start}
                GROUP BY 1
            `
        ]);

        const propMap = {};
        propStats.forEach(s => {
            const d = new Date(s.month);
            propMap[`${d.getFullYear()}-${d.getMonth()}`] = s.count;
        });

        const intMap = {};
        intStats.forEach(s => {
            const d = new Date(s.month);
            intMap[`${d.getFullYear()}-${d.getMonth()}`] = s.count;
        });

        const monthlyStats = months.map((m) => ({
            name: m.name,
            portföy: propMap[`${m.year}-${m.month}`] || 0,
            etkileşim: intMap[`${m.year}-${m.month}`] || 0
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
