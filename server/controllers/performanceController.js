const { Prisma } = require('@prisma/client');
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

        if (consultants.length === 0) {
            return res.json([]);
        }

        const consultantIds = consultants.map(c => c.id);

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // OPTIMIZATION: Use bulk groupBy operations instead of N+1 queries
        // This reduces queries from 5N+1 to 5 constant queries regardless of consultant count.

        const [propertyStats, newPortfolioStats, interactionStats, taskStats] = await Promise.all([
            // 1. Group active properties by user and type
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds }, status: 'active' },
                _count: { id: true }
            }),
            // 2. Group new portfolios (assigned this month) by user
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Interactions made (via clients assigned to them) this month
            // Note: Using $queryRaw for multi-table aggregation as Prisma groupBy doesn't support relations
            prisma.$queryRaw`
                SELECT c.consultant_id as "consultantId", COUNT(*)::int as "count"
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${Prisma.join(consultantIds)})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Completed tasks this month
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

        // Map stats to consultants for efficient lookup
        const performanceData = consultants.map(c => {
            const userProperties = propertyStats.filter(ps => ps.assigned_user_id === c.id);
            const saleCount = userProperties.find(ps => ps.listing_type === 'sale')?._count.id || 0;
            const rentCount = userProperties.find(ps => ps.listing_type === 'rent')?._count.id || 0;

            const newPortfolioCount = newPortfolioStats.find(ps => ps.assigned_user_id === c.id)?._count.id || 0;
            const interactionCount = interactionStats.find(is => is.consultantId === c.id)?.count || 0;
            const completedTasks = taskStats.find(ts => ts.user_id === c.id)?._count.id || 0;

            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: saleCount,
                    active_rent: rentCount,
                    new_portfolio_monthly: newPortfolioCount,
                    interactions_monthly: interactionCount,
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

        const rangeStart = months[0].start;
        const rangeEnd = months[months.length - 1].end;

        // OPTIMIZATION: Fetch all historical data in 2 queries instead of 12 (6 months * 2 queries)
        const [allProperties, allInteractions] = await Promise.all([
            prisma.property.findMany({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: rangeStart, lte: rangeEnd }
                },
                select: { created_at: true }
            }),
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: rangeStart, lte: rangeEnd }
                },
                select: { date: true }
            })
        ]);

        const monthlyStats = months.map(m => {
            const propCount = allProperties.filter(p => {
                const date = new Date(p.created_at);
                return date >= m.start && date <= m.end;
            }).length;

            const intCount = allInteractions.filter(i => {
                const date = new Date(i.date);
                return date >= m.start && date <= m.end;
            }).length;

            return {
                name: m.name,
                portföy: propCount,
                etkileşim: intCount
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
