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

        if (consultants.length === 0) return res.json([]);

        const consultantIds = consultants.map(c => c.id);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // BOLT OPTIMIZATION: Use bulk aggregations instead of N+1 queries
        // This reduces queries from 5N+1 to 5 constant queries.
        const [
            propertyCounts,
            newPortfolioCounts,
            completedTaskCounts,
            interactionCounts
        ] = await Promise.all([
            // 1. Group active sale/rent properties by consultant
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { _all: true }
            }),
            // 2. Group new monthly portfolios
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { _all: true }
            }),
            // 3. Group completed agenda items
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultantIds },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { _all: true }
            }),
            // 4. Group interactions via Raw SQL (Prisma groupBy doesn't support relation grouping)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds.length > 0 ? consultantIds : [null]})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `
        ]);

        // Map results for O(1) lookup
        const saleMap = {};
        const rentMap = {};
        propertyCounts.forEach(item => {
            if (item.listing_type === 'sale') saleMap[item.assigned_user_id] = item._count._all;
            else if (item.listing_type === 'rent') rentMap[item.assigned_user_id] = item._count._all;
        });

        const newPortfolioMap = {};
        newPortfolioCounts.forEach(item => {
            newPortfolioMap[item.assigned_user_id] = item._count._all;
        });

        const completedTasksMap = {};
        completedTaskCounts.forEach(item => {
            completedTasksMap[item.user_id] = item._count._all;
        });

        const interactionMap = {};
        interactionCounts.forEach(item => {
            if (item.consultant_id) interactionMap[item.consultant_id] = item.count;
        });

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
                completed_tasks_monthly: completedTasksMap[c.id] || 0
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

        const sixMonthsAgo = months[0].start;

        // BOLT OPTIMIZATION: Fetch all data in 2 queries instead of 12 (2 per month)
        const [properties, interactions] = await Promise.all([
            prisma.property.findMany({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: sixMonthsAgo }
                },
                select: { created_at: true }
            }),
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: sixMonthsAgo }
                },
                select: { date: true }
            })
        ]);

        const monthlyStats = months.map(m => {
            const pCount = properties.filter(p => p.created_at >= m.start && p.created_at <= m.end).length;
            const iCount = interactions.filter(i => i.date >= m.start && i.date <= m.end).length;
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
