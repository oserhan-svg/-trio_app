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

        // OPTIMIZATION: ⚡ Bulk aggregation to avoid 5N queries
        const [propTypeCounts, newPropCounts, interactionCounts, agendaCounts] = await Promise.all([
            // 1. Group by listing type and user
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds }, status: 'active' },
                _count: { _all: true }
            }),
            // 2. New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { _all: true }
            }),
            // 3. Interactions this month (Join needed)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds}) AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Completed tasks this month
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { _all: true }
            })
        ]);

        // Helper to extract count from grouped results
        const getCount = (list, userId, filterField = null, filterValue = null, countField = '_count', idField = 'assigned_user_id') => {
            const item = list.find(i =>
                i[idField] === userId && (!filterField || i[filterField] === filterValue)
            );
            if (!item) return 0;
            return typeof item[countField] === 'object' ? item[countField]._all : item[countField];
        };

        const performanceData = consultants.map(c => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: getCount(propTypeCounts, c.id, 'listing_type', 'sale'),
                    active_rent: getCount(propTypeCounts, c.id, 'listing_type', 'rent'),
                    new_portfolio_monthly: getCount(newPropCounts, c.id),
                    interactions_monthly: getCount(interactionCounts, c.id, null, null, 'count', 'consultant_id'),
                    completed_tasks_monthly: getCount(agendaCounts, c.id, null, null, '_count', 'user_id')
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
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                start: new Date(d.getFullYear(), d.getMonth(), 1)
            });
        }

        const startRange = months[months.length - 1].start;

        // OPTIMIZATION: ⚡ Use bulk aggregation for time-series data
        const [rawPropStats, rawIntStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month_key, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startRange}
                GROUP BY month_key
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month_key, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startRange}
                GROUP BY month_key
            `
        ]);

        const monthlyStats = months.map(m => {
            const propStat = rawPropStats.find(s => s.month_key === m.key);
            const intStat = rawIntStats.find(s => s.month_key === m.key);
            return {
                name: m.name,
                portföy: propStat ? propStat.count : 0,
                etkileşim: intStat ? intStat.count : 0
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
