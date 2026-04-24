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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // BOLT OPTIMIZATION: Eliminate N+1 queries with bulk aggregations
        const [propertyStats, monthlyPortfolioStats, taskStats, interactionStats] = await Promise.all([
            // 1. Bulk Property Type Counts
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. Bulk Monthly New Portfolios
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Bulk Monthly Completed Tasks
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 4. Bulk Monthly Interactions (Requires Join via raw query)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ANY(${consultantIds})
                  AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `
        ]);

        // Efficient Mapping via Hash Maps O(N)
        const portfolioMap = {};
        propertyStats.forEach(s => {
            const uid = s.assigned_user_id;
            if (!portfolioMap[uid]) portfolioMap[uid] = { sale: 0, rent: 0 };
            portfolioMap[uid][s.listing_type] = s._count.id;
        });

        const monthlyPortfolioMap = Object.fromEntries(monthlyPortfolioStats.map(s => [s.assigned_user_id, s._count.id]));
        const taskMap = Object.fromEntries(taskStats.map(s => [s.user_id, s._count.id]));
        const interactionMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: portfolioMap[c.id]?.sale || 0,
                active_rent: portfolioMap[c.id]?.rent || 0,
                new_portfolio_monthly: monthlyPortfolioMap[c.id] || 0,
                interactions_monthly: interactionMap[c.id] || 0,
                completed_tasks_monthly: taskMap[c.id] || 0
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
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                start: new Date(d.getFullYear(), d.getMonth(), 1)
            });
        }
        const oldestMonth = months[0].start;

        // BOLT OPTIMIZATION: Use date_trunc for efficient monthly grouping in 2 queries instead of 12
        const [propCounts, interactionCounts] = await Promise.all([
            prisma.$queryRaw`
                SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${oldestMonth}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT to_char(date_trunc('month', i.date), 'YYYY-MM') as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${oldestMonth}
                GROUP BY 1
            `
        ]);

        const propMap = Object.fromEntries(propCounts.map(r => [r.month, r.count]));
        const intMap = Object.fromEntries(interactionCounts.map(r => [r.month, r.count]));

        const monthlyStats = months.map(m => ({
            name: m.name,
            portföy: propMap[m.key] || 0,
            etkileşim: intMap[m.key] || 0
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
