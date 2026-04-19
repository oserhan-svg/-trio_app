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

        // BULK OPTIMIZATION: Reduce 5N+1 queries to 5 total queries
        const [propertyStats, newPortfolioStats, interactionStats, taskStats] = await Promise.all([
            // 1. Sale/Rent counts for all consultants
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { _all: true }
            }),
            // 2. New portfolios this month for all consultants
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { _all: true }
            }),
            // 3. Interaction counts via raw SQL (Prisma doesn't support grouping by joined relation)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(*)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds.length > 0 ? consultantIds : [null]})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Completed tasks this month for all consultants
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { _all: true }
            })
        ]);

        // Convert stats to Maps for O(1) lookups
        const propMap = new Map();
        propertyStats.forEach(s => propMap.set(`${s.assigned_user_id}-${s.listing_type}`, s._count._all));

        const newPortfolioMap = new Map();
        newPortfolioStats.forEach(s => newPortfolioMap.set(s.assigned_user_id, s._count._all));

        const interactionMap = new Map();
        interactionStats.forEach(i => interactionMap.set(i.consultant_id, i.count));

        const taskMap = new Map();
        taskStats.forEach(t => taskMap.set(t.user_id, t._count._all));

        // Reconstruct performance data in-memory (O(N) mapping)
        const performanceData = consultants.map(c => {
            const saleCount = propMap.get(`${c.id}-sale`) || 0;
            const rentCount = propMap.get(`${c.id}-rent`) || 0;
            const newPortfolioCount = newPortfolioMap.get(c.id) || 0;
            const interactionCount = interactionMap.get(c.id) || 0;
            const completedTasks = taskMap.get(c.id) || 0;

            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: saleCount,
                    active_rent: rentCount,
                    new_portfolio_monthly: newPortfolioCount,
                    interactions_monthly: Number(interactionCount),
                    completed_tasks_monthly: completedTasks
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

        // BULK OPTIMIZATION: Fetch 6 months of data in 2 queries instead of 12
        const startDate = months[0].start;
        const [historicalProperties, historicalInteractions] = await Promise.all([
            prisma.property.findMany({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: startDate }
                },
                select: { created_at: true }
            }),
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: startDate }
                },
                select: { date: true }
            })
        ]);

        const monthlyStats = months.map(m => {
            const propertiesCount = historicalProperties.filter(p =>
                p.created_at >= m.start && p.created_at <= m.end
            ).length;

            const interactionsCount = historicalInteractions.filter(i =>
                i.date >= m.start && i.date <= m.end
            ).length;

            return {
                name: m.name,
                portföy: propertiesCount,
                etkileşim: interactionsCount
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
