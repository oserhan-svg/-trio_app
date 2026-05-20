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

        // ⚡ Bolt Optimization: Use bulk aggregations to avoid N+1 queries (O(1) instead of O(N))
        const [propertyTypeStats, newPortfolioStats, interactionStats, taskStats] = await Promise.all([
            // 1. Sale/Rent counts (Maintain parity with original by not filtering status unless intended)
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { not: null } },
                _count: { id: true }
            }),
            // 2. New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { not: null }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Interactions this month (using $queryRaw for cross-relation grouping)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Completed tasks this month
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Helper maps for O(1) lookup
        const typeMap = {};
        propertyTypeStats.forEach(s => {
            const uid = s.assigned_user_id;
            if (!typeMap[uid]) typeMap[uid] = { sale: 0, rent: 0 };
            if (s.listing_type === 'sale') typeMap[uid].sale = s._count.id;
            else if (s.listing_type === 'rent') typeMap[uid].rent = s._count.id;
        });

        const newPortfolioMap = Object.fromEntries(newPortfolioStats.map(s => [s.assigned_user_id, s._count.id]));
        const interactionMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const taskMap = Object.fromEntries(taskStats.map(s => [s.user_id, s._count.id]));

        const performanceData = consultants.map((c) => {
            const stats = typeMap[c.id] || { sale: 0, rent: 0 };
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: stats.sale,
                    active_rent: stats.rent,
                    new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                    interactions_monthly: interactionMap[c.id] || 0,
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

        // ⚡ Bolt Optimization: Aggregated monthly stats in 2 queries instead of 12
        const sixMonthsAgo = months[0].start;

        const [monthlyProperties, monthlyInteractions] = await Promise.all([
            prisma.$queryRaw`
                SELECT
                    EXTRACT(YEAR FROM created_at)::int as year,
                    EXTRACT(MONTH FROM created_at)::int as month,
                    COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${sixMonthsAgo}
                GROUP BY year, month
            `,
            prisma.$queryRaw`
                SELECT
                    EXTRACT(YEAR FROM i.date)::int as year,
                    EXTRACT(MONTH FROM i.date)::int as month,
                    COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${sixMonthsAgo}
                GROUP BY year, month
            `
        ]);

        const propMap = {};
        monthlyProperties.forEach(p => propMap[`${p.year}-${p.month}`] = p.count);
        const intMap = {};
        monthlyInteractions.forEach(i => intMap[`${i.year}-${i.month}`] = i.count);

        const monthlyStats = months.map(m => {
            // Use robust string keys for lookup (Postgres EXTRACT returns 1-12 for months)
            const year = m.year;
            const month = m.month + 1;
            const key = `${year}-${month}`;

            return {
                name: m.name,
                portföy: propMap[key] || 0,
                etkileşim: intMap[key] || 0
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
