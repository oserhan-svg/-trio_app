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

        // BOLT OPTIMIZATION: N+1 Query Elimination
        // Replace per-consultant queries with bulk aggregations (O(1) database trips instead of O(N))

        // 1. Bulk count properties by type and consultant
        const typeCounts = await prisma.property.groupBy({
            by: ['assigned_user_id', 'listing_type'],
            where: { assigned_user_id: { in: consultants.map(c => c.id) } },
            _count: { id: true }
        });

        // 2. Bulk count new portfolios this month
        const newPortfolioCounts = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: {
                assigned_user_id: { in: consultants.map(c => c.id) },
                created_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // 3. Bulk count interactions (requires join via clients)
        const interactionCounts = await prisma.$queryRaw`
            SELECT c.consultant_id, COUNT(i.id)::int as count
            FROM interactions i
            JOIN clients c ON i.client_id = c.id
            WHERE c.consultant_id IS NOT NULL
              AND i.date >= ${startOfMonth}
            GROUP BY c.consultant_id
        `;

        // 4. Bulk count completed tasks
        const taskCounts = await prisma.agendaItem.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: consultants.map(c => c.id) },
                status: 'completed',
                start_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // Map bulk results for O(1) lookup
        const typeMap = {};
        typeCounts.forEach(tc => {
            if (!typeMap[tc.assigned_user_id]) typeMap[tc.assigned_user_id] = {};
            typeMap[tc.assigned_user_id][tc.listing_type] = tc._count.id;
        });

        const portfolioMap = new Map(newPortfolioCounts.map(c => [c.assigned_user_id, c._count.id]));
        const interactionMap = new Map(interactionCounts.map(c => [c.consultant_id, c.count]));
        const taskMap = new Map(taskCounts.map(c => [c.user_id, c._count.id]));

        const performanceData = consultants.map((c) => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: typeMap[c.id]?.sale || 0,
                    active_rent: typeMap[c.id]?.rent || 0,
                    new_portfolio_monthly: portfolioMap.get(c.id) || 0,
                    interactions_monthly: interactionMap.get(c.id) || 0,
                    completed_tasks_monthly: taskMap.get(c.id) || 0
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
        const startOfRange = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // BOLT OPTIMIZATION: Bulk Time-Series Aggregation
        // Use $queryRaw with date_trunc to fetch 6 months of stats in 2 queries instead of 12

        const propertyMonthlyRaw = await prisma.$queryRaw`
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month_key,
                COUNT(*)::int as count
            FROM properties
            WHERE assigned_user_id = ${consultantId}
              AND created_at >= ${startOfRange}
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) DESC
        `;

        const interactionMonthlyRaw = await prisma.$queryRaw`
            SELECT
                TO_CHAR(DATE_TRUNC('month', i.date), 'YYYY-MM') as month_key,
                COUNT(i.id)::int as count
            FROM interactions i
            JOIN clients c ON i.client_id = c.id
            WHERE c.consultant_id = ${consultantId}
              AND i.date >= ${startOfRange}
            GROUP BY DATE_TRUNC('month', i.date)
            ORDER BY DATE_TRUNC('month', i.date) DESC
        `;

        const propMap = new Map(propertyMonthlyRaw.map(r => [r.month_key, r.count]));
        const intMap = new Map(interactionMonthlyRaw.map(r => [r.month_key, r.count]));

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = d.toISOString().slice(0, 7); // YYYY-MM

            months.push({
                name: d.toLocaleString('tr-TR', { month: 'long' }),
                portföy: propMap.get(monthKey) || 0,
                etkileşim: intMap.get(monthKey) || 0
            });
        }

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
            monthlyStats: months,
            clientStatusDist: clientStatusDist.map(d => ({ name: d.status, value: d._count.id })),
            recentInteractions
        });
    } catch (error) {
        console.error('Consultant Detail API Error:', error);
        res.status(500).json({ message: 'Detay verileri alınamadı.' });
    }
};
