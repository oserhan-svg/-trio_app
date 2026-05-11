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

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Optimization: Use bulk aggregations (O(1) database queries instead of O(N))
        const [propertyCounts, newPortfolioCounts, completedTasksCounts, interactionCounts] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultants.map(c => c.id) } },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultants.map(c => c.id) },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultants.map(c => c.id) },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            // Complex join requires $queryRaw for multi-consultant aggregation
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth}
                AND c.consultant_id IN (${Prisma.join(consultants.map(c => c.id))})
                GROUP BY c.consultant_id
            `
        ]);

        // Helper to get count from grouped results
        const getCount = (arr, userId, key = 'assigned_user_id', filterValue = null, filterKey = null) => {
            const item = arr.find(d =>
                d[key] === userId && (filterKey ? d[filterKey] === filterValue : true)
            );
            return item ? (item._count?.id || item.count || 0) : 0;
        };

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: getCount(propertyCounts, c.id, 'assigned_user_id', 'sale', 'listing_type'),
                active_rent: getCount(propertyCounts, c.id, 'assigned_user_id', 'rent', 'listing_type'),
                new_portfolio_monthly: getCount(newPortfolioCounts, c.id),
                interactions_monthly: getCount(interactionCounts, c.id, 'consultant_id'),
                completed_tasks_monthly: getCount(completedTasksCounts, c.id, 'user_id')
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

        // Optimization: Single raw query for all monthly stats to avoid N+1 queries
        const sixMonthsAgo = months[0].start;

        const [monthlyPropertyCounts, monthlyInteractionCounts] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'Month') as name,
                       EXTRACT(MONTH FROM created_at) as month_num,
                       EXTRACT(YEAR FROM created_at) as year_num,
                       COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId}
                AND created_at >= ${sixMonthsAgo}
                GROUP BY name, month_num, year_num
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'Month') as name,
                       EXTRACT(MONTH FROM i.date) as month_num,
                       EXTRACT(YEAR FROM i.date) as year_num,
                       COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId}
                AND i.date >= ${sixMonthsAgo}
                GROUP BY name, month_num, year_num
            `
        ]);

        const monthlyStats = months.map(m => {
            const pCount = monthlyPropertyCounts.find(p =>
                Number(p.month_num) === (m.month + 1) && Number(p.year_num) === m.year
            );
            const iCount = monthlyInteractionCounts.find(i =>
                Number(i.month_num) === (m.month + 1) && Number(i.year_num) === m.year
            );

            return {
                name: m.name,
                portföy: pCount ? pCount.count : 0,
                etkileşim: iCount ? iCount.count : 0
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
