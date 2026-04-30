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

        // Optimization: Use bulk aggregations instead of N+1 count queries (1 + 5N queries avoided)
        const [propertyTypeCounts, newPortfolioCounts, interactionCounts, agendaCounts] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { not: null } },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { not: null },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            })
        ]);

        // Map results for O(1) lookup
        const saleMap = {};
        const rentMap = {};
        propertyTypeCounts.forEach(p => {
            if (p.listing_type === 'sale') saleMap[p.assigned_user_id] = p._count.id;
            if (p.listing_type === 'rent') rentMap[p.assigned_user_id] = p._count.id;
        });

        const newPortfolioMap = {};
        newPortfolioCounts.forEach(p => { newPortfolioMap[p.assigned_user_id] = p._count.id; });

        const interactionMap = {};
        interactionCounts.forEach(i => { if (i.consultant_id) interactionMap[i.consultant_id] = i.count; });

        const agendaMap = {};
        agendaCounts.forEach(a => { agendaMap[a.user_id] = a._count.id; });

        const performanceData = consultants.map((c) => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: saleMap[c.id] || 0,
                active_rent: rentMap[c.id] || 0,
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

        const startDate = months[0].start;
        const endDate = months[months.length - 1].end;

        // Optimization: Use bulk aggregations for time-series data
        const [propertyMonthly, interactionMonthly] = await Promise.all([
            prisma.$queryRaw`
                SELECT DATE_TRUNC('month', created_at) as month, COUNT(id)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startDate} AND created_at <= ${endDate}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT DATE_TRUNC('month', i.date) as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startDate} AND i.date <= ${endDate}
                GROUP BY 1
            `
        ]);

        const propMap = {};
        propertyMonthly.forEach(row => {
            const date = new Date(row.month);
            // Key format: YYYY-MM
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            propMap[key] = row.count;
        });

        const intMap = {};
        interactionMonthly.forEach(row => {
            const date = new Date(row.month);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            intMap[key] = row.count;
        });

        const monthlyStats = months.map((m) => {
            const key = `${m.start.getFullYear()}-${String(m.start.getMonth() + 1).padStart(2, '0')}`;
            return {
                name: m.name,
                portföy: propMap[key] || 0,
                etkileşim: intMap[key] || 0
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
