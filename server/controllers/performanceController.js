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

        // 1. Bulk fetch Property stats
        const propertyStats = await prisma.property.groupBy({
            by: ['assigned_user_id', 'listing_type'],
            where: { assigned_user_id: { in: consultantIds } },
            _count: { id: true }
        });

        // 2. Bulk fetch New Portfolios this month
        const newPortfolioStats = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: {
                assigned_user_id: { in: consultantIds },
                created_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // 3. Bulk fetch Interaction counts (requires join)
        // Using Prisma $queryRaw with template literal
        const interactionStats = await prisma.$queryRaw`
            SELECT c.consultant_id, COUNT(i.id)::int as count
            FROM interactions i
            JOIN clients c ON i.client_id = c.id
            WHERE c.consultant_id IN (${consultantIds})
              AND i.date >= ${startOfMonth}
            GROUP BY c.consultant_id
        `;

        // 4. Bulk fetch Completed Agenda tasks
        const agendaStats = await prisma.agendaItem.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: consultantIds },
                status: 'completed',
                start_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // Helper maps for O(1) lookup
        const propMap = {};
        propertyStats.forEach(s => {
            const uid = s.assigned_user_id;
            if (!propMap[uid]) propMap[uid] = { sale: 0, rent: 0 };
            if (s.listing_type === 'sale') propMap[uid].sale = s._count.id;
            if (s.listing_type === 'rent') propMap[uid].rent = s._count.id;
        });

        const newPortfolioMap = Object.fromEntries(newPortfolioStats.map(s => [s.assigned_user_id, s._count.id]));
        const interactionMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const agendaMap = Object.fromEntries(agendaStats.map(s => [s.user_id, s._count.id]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propMap[c.id]?.sale || 0,
                active_rent: propMap[c.id]?.rent || 0,
                new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                interactions_monthly: interactionMap[c.id] || 0,
                completed_tasks_monthly: agendaMap[c.id] || 0
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
                start: new Date(d.getFullYear(), d.getMonth(), 1),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
            });
        }

        const sixMonthsAgo = months[months.length - 1].start;

        // Optimized monthly aggregation using $queryRaw
        const [propertyStats, interactionStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'Month') as month_name, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId}
                  AND created_at >= ${sixMonthsAgo}
                GROUP BY TO_CHAR(created_at, 'Month'), DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'Month') as month_name, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId}
                  AND i.date >= ${sixMonthsAgo}
                GROUP BY TO_CHAR(i.date, 'Month'), DATE_TRUNC('month', i.date)
                ORDER BY DATE_TRUNC('month', i.date)
            `
        ]);

        const propMap = Object.fromEntries(propertyStats.map(s => [s.month_name.trim(), s.count]));
        const intMap = Object.fromEntries(interactionStats.map(s => [s.month_name.trim(), s.count]));

        const monthlyStats = months.map(m => ({
            name: m.name,
            portföy: propMap[m.name] || 0,
            etkileşim: intMap[m.name] || 0
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
