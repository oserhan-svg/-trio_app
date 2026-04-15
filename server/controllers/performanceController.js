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

        // [BOLT OPTIMIZATION] Batch processing to avoid N+1 queries (5N+1 -> 6 queries total)
        const [
            typeCounts,
            monthlyPortfolio,
            monthlyInteractions,
            monthlyTasks
        ] = await Promise.all([
            // Batch 1: Listing type counts (Sale/Rent)
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { _all: true }
            }),
            // Batch 2: New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { _all: true }
            }),
            // Batch 3: Interactions this month (using Raw SQL for performance)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${Prisma.join(consultantIds)})
                  AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // Batch 4: Completed tasks this month
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultantIds },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { _all: true }
            })
        ]);

        // Map results for O(1) lookup
        const typeMap = {};
        typeCounts.forEach(tc => {
            if (!typeMap[tc.assigned_user_id]) typeMap[tc.assigned_user_id] = { sale: 0, rent: 0 };
            if (tc.listing_type === 'sale') typeMap[tc.assigned_user_id].sale = tc._count._all;
            if (tc.listing_type === 'rent') typeMap[tc.assigned_user_id].rent = tc._count._all;
        });

        const portfolioMap = Object.fromEntries(monthlyPortfolio.map(p => [p.assigned_user_id, p._count._all]));
        const interactionMap = Object.fromEntries(monthlyInteractions.map(i => [i.consultant_id, i.count]));
        const taskMap = Object.fromEntries(monthlyTasks.map(t => [t.user_id, t._count._all]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: typeMap[c.id]?.sale || 0,
                active_rent: typeMap[c.id]?.rent || 0,
                new_portfolio_monthly: portfolioMap[c.id] || 0,
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
                month: d.getMonth(),
                year: d.getFullYear(),
                start: new Date(d.getFullYear(), d.getMonth(), 1),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
            });
        }

        // [BOLT OPTIMIZATION] Range-based fetching to replace 12 individual count queries with 2 queries.
        const startOfRange = months[months.length - 1].start;
        const endOfRange = months[0].end;

        const [rangeProperties, rangeInteractions, clientStatusDist, recentInteractions] = await Promise.all([
            // Query 1: All properties in range
            prisma.property.findMany({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: startOfRange, lte: endOfRange }
                },
                select: { created_at: true }
            }),
            // Query 2: All interactions in range
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: startOfRange, lte: endOfRange }
                },
                select: { date: true }
            }),
            // Query 3: Client distribution
            prisma.client.groupBy({
                by: ['status'],
                where: { consultant_id: consultantId },
                _count: { id: true }
            }),
            // Query 4: Recent activities
            prisma.interaction.findMany({
                where: { client: { consultant_id: consultantId } },
                orderBy: { date: 'desc' },
                take: 10,
                include: { client: { select: { name: true } } }
            })
        ]);

        // Group by month in memory
        const monthlyStats = months.map(m => {
            const propertiesCount = rangeProperties.filter(p => {
                const date = new Date(p.created_at);
                return date >= m.start && date <= m.end;
            }).length;

            const interactionsCount = rangeInteractions.filter(i => {
                const date = new Date(i.date);
                return date >= m.start && date <= m.end;
            }).length;

            return {
                name: m.name,
                portföy: propertiesCount,
                etkileşim: interactionsCount
            };
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
