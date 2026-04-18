const prisma = require('../db');
const { Prisma } = require('@prisma/client');

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

        if (consultants.length === 0) return res.json([]);

        const consultantIds = consultants.map(c => c.id);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // BOLT OPTIMIZATION: Use bulk aggregations to avoid N+1 queries
        // 1. Property Type Counts (Sale/Rent)
        const propertyGroups = await prisma.property.groupBy({
            by: ['assigned_user_id', 'listing_type'],
            where: { assigned_user_id: { in: consultantIds } },
            _count: { _all: true }
        });

        // 2. New portfolios (Properties assigned this month)
        const newPortfolios = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: {
                assigned_user_id: { in: consultantIds },
                created_at: { gte: startOfMonth }
            },
            _count: { _all: true }
        });

        // 3. Completed Agenda tasks
        const completedTasks = await prisma.agendaItem.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: consultantIds },
                status: 'completed',
                start_at: { gte: startOfMonth }
            },
            _count: { _all: true }
        });

        // 4. Interactions made (requires raw query for relation aggregation or manual mapping)
        // Since Prisma groupBy doesn't support grouping by a relation field (client.consultant_id),
        // we use a raw query which is significantly faster than N queries.
        const interactionCounts = await prisma.$queryRaw`
            SELECT c.consultant_id, COUNT(i.id)::int as count
            FROM interactions i
            JOIN clients c ON i.client_id = c.id
            WHERE c.consultant_id IN (${Prisma.join(consultantIds)})
              AND i.date >= ${startOfMonth}
            GROUP BY c.consultant_id
        `;

        // Map results for quick lookup
        const propMap = {};
        propertyGroups.forEach(pg => {
            if (!propMap[pg.assigned_user_id]) propMap[pg.assigned_user_id] = { sale: 0, rent: 0 };
            propMap[pg.assigned_user_id][pg.listing_type] = pg._count._all;
        });

        const newPortMap = {};
        newPortfolios.forEach(np => {
            newPortMap[np.assigned_user_id] = np._count._all;
        });

        const taskMap = {};
        completedTasks.forEach(t => {
            taskMap[t.user_id] = t._count._all;
        });

        const intMap = {};
        interactionCounts.forEach(i => {
            intMap[i.consultant_id] = i.count;
        });

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propMap[c.id]?.sale || 0,
                active_rent: propMap[c.id]?.rent || 0,
                new_portfolio_monthly: newPortMap[c.id] || 0,
                interactions_monthly: intMap[c.id] || 0,
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
                month: d.getMonth(),
                year: d.getFullYear(),
                start: new Date(d.getFullYear(), d.getMonth(), 1),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
            });
        }

        const rangeStart = months[0].start;

        // BOLT OPTIMIZATION: Fetch all data in range once and group in memory
        const [properties, interactions] = await Promise.all([
            prisma.property.findMany({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: rangeStart }
                },
                select: { created_at: true }
            }),
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: rangeStart }
                },
                select: { date: true }
            })
        ]);

        const monthlyStats = months.map(m => {
            const pCount = properties.filter(p => {
                const d = new Date(p.created_at);
                return d.getMonth() === m.month && d.getFullYear() === m.year;
            }).length;

            const iCount = interactions.filter(i => {
                const d = new Date(i.date);
                return d.getMonth() === m.month && d.getFullYear() === m.year;
            }).length;

            return {
                name: m.name,
                portföy: pCount,
                etkileşim: iCount
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
