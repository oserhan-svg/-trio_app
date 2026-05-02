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

        // BOLT OPTIMIZATION: Use bulk aggregations instead of N+1 queries in a loop
        const [propertyStats, newPortfolioStats, interactionStats, agendaStats] = await Promise.all([
            // 1. Bulk count properties by type and user
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. Bulk count new portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Bulk count interactions via JOIN (using $queryRaw for cross-model aggregation)
            prisma.$queryRaw`
                SELECT c.consultant_id as "consultantId", COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds}) AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Bulk count completed agenda tasks
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Create fast lookup maps
        const propertyMap = {};
        propertyStats.forEach(s => {
            const key = `${s.assigned_user_id}_${s.listing_type}`;
            propertyMap[key] = s._count.id;
        });

        const newPortfolioMap = {};
        newPortfolioStats.forEach(s => { newPortfolioMap[s.assigned_user_id] = s._count.id; });

        const interactionMap = {};
        interactionStats.forEach(s => { interactionMap[s.consultantId] = s.count; });

        const agendaMap = {};
        agendaStats.forEach(s => { agendaMap[s.user_id] = s._count.id; });

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propertyMap[`${c.id}_sale`] || 0,
                active_rent: propertyMap[`${c.id}_rent`] || 0,
                new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                interactions_monthly: interactionMap[c.id] || 0,
                completed_tasks_monthly: agendaMap[c.id] || 0
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

        // BOLT OPTIMIZATION: Fetch all monthly stats in two bulk queries instead of a loop
        const startOfPeriod = months[months.length - 1].start;

        const [bulkProperties, bulkInteractions] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startOfPeriod}
                GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startOfPeriod}
                GROUP BY TO_CHAR(i.date, 'YYYY-MM')
            `
        ]);

        const propMonthMap = {};
        bulkProperties.forEach(p => { propMonthMap[p.month] = p.count; });

        const intMonthMap = {};
        bulkInteractions.forEach(i => { intMonthMap[i.month] = i.count; });

        const monthlyStats = months.map(m => {
            const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            return {
                name: m.name,
                portföy: propMonthMap[monthKey] || 0,
                etkileşim: intMonthMap[monthKey] || 0
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
