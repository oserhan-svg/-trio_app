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

        // BULK OPTIMIZATION: Use aggregations to avoid N+1 queries
        // 1. Property counts by type
        const propertyTypeCounts = await prisma.property.groupBy({
            by: ['assigned_user_id', 'listing_type'],
            where: { assigned_user_id: { in: consultantIds } },
            _count: { id: true }
        });

        // 2. New portfolios this month
        const monthlyPortfolioCounts = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: {
                assigned_user_id: { in: consultantIds },
                created_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // 3. Interactions this month (via raw query for JOIN)
        const interactionCounts = await prisma.$queryRaw`
            SELECT c.consultant_id, COUNT(i.id)::int as count
            FROM interactions i
            JOIN clients c ON i.client_id = c.id
            WHERE c.consultant_id IN (${consultantIds})
              AND i.date >= ${startOfMonth}
            GROUP BY c.consultant_id
        `;

        // 4. Completed tasks this month
        const completedTaskCounts = await prisma.agendaItem.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: consultantIds },
                status: 'completed',
                start_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // Helper to get count from grouped results
        const getCount = (list, userId, filterKey = null, filterVal = null, idKey = 'assigned_user_id') => {
            const item = list.find(i =>
                i[idKey] === userId &&
                (!filterKey || i[filterKey] === filterVal)
            );
            return item ? (item._count?.id || item.count || 0) : 0;
        };

        const performanceData = consultants.map((c) => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: getCount(propertyTypeCounts, c.id, 'listing_type', 'sale'),
                    active_rent: getCount(propertyTypeCounts, c.id, 'listing_type', 'rent'),
                    new_portfolio_monthly: getCount(monthlyPortfolioCounts, c.id),
                    interactions_monthly: getCount(interactionCounts, c.id, null, null, 'consultant_id'),
                    completed_tasks_monthly: getCount(completedTaskCounts, c.id, null, null, 'user_id')
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

        // BULK OPTIMIZATION: Fetch all monthly stats in two queries instead of 12
        const startDate = months[0].start;
        const endDate = months[months.length - 1].end;

        const [monthlyProperties, monthlyInteractions] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(id)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId}
                  AND created_at BETWEEN ${startDate} AND ${endDate}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId}
                  AND i.date BETWEEN ${startDate} AND ${endDate}
                GROUP BY 1
            `
        ]);

        const monthlyStats = months.map(m => {
            const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            const pCount = monthlyProperties.find(p => p.month === monthKey)?.count || 0;
            const iCount = monthlyInteractions.find(i => i.month === monthKey)?.count || 0;

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
