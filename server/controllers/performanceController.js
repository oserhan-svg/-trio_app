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

        // Optimization: Bulk fetch stats instead of per-consultant loop (N+1 eliminated)
        const [propertyStats, newPortfolioStats, interactionStats, taskStats] = await Promise.all([
            // 1. Sale/Rent Counts
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { not: null } },
                _count: { id: true }
            }),
            // 2. New Portfolio Counts
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { not: null }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Interaction Counts (Requires Join/Raw)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(*)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth} AND c.consultant_id IS NOT NULL
                GROUP BY c.consultant_id
            `,
            // 4. Task Counts
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Map stats to lookup objects for O(1) access
        const propMap = {};
        propertyStats.forEach(s => {
            if (!propMap[s.assigned_user_id]) propMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            if (s.listing_type === 'sale') propMap[s.assigned_user_id].sale = s._count.id;
            if (s.listing_type === 'rent') propMap[s.assigned_user_id].rent = s._count.id;
        });

        const newPortMap = Object.fromEntries(newPortfolioStats.map(s => [s.assigned_user_id, s._count.id]));
        const intMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const taskMap = Object.fromEntries(taskStats.map(s => [s.user_id, s._count.id]));

        const performanceData = consultants.map(c => {
            const pStats = propMap[c.id] || { sale: 0, rent: 0 };
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: pStats.sale,
                    active_rent: pStats.rent,
                    new_portfolio_monthly: newPortMap[c.id] || 0,
                    interactions_monthly: intMap[c.id] || 0,
                    completed_tasks_monthly: taskMap[c.id] || 0
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

        // Optimization: Use raw SQL to group by month in a single query (N+1 eliminated)
        const sixMonthsAgo = months[0].start;

        const [propMonthly, intMonthly] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${sixMonthsAgo}
                GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month, COUNT(*)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${sixMonthsAgo}
                GROUP BY TO_CHAR(i.date, 'YYYY-MM')
            `
        ]);

        const propMonthMap = Object.fromEntries(propMonthly.map(m => [m.month, m.count]));
        const intMonthMap = Object.fromEntries(intMonthly.map(m => [m.month, m.count]));

        const monthlyStats = months.map(m => {
            const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            return {
                name: m.name,
                portföy: propMonthMap[key] || 0,
                etkileşim: intMonthMap[key] || 0
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
