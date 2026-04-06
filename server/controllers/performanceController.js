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

        const consultantIds = consultants.map(c => c.id);

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Fetch Property counts (Sale/Rent) in bulk
        const propertyCounts = await prisma.property.groupBy({
            by: ['assigned_user_id', 'listing_type'],
            where: {
                assigned_user_id: { in: consultantIds },
                listing_type: { in: ['sale', 'rent'] }
            },
            _count: { id: true }
        });

        // 2. Fetch New Portfolios this month in bulk
        const newPortfolioCounts = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: {
                assigned_user_id: { in: consultantIds },
                created_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // 3. Fetch Interaction counts in bulk (Requires raw SQL or nested groupBy which Prisma doesn't support well for relations)
        // We join interactions with clients to group by consultant_id
        const interactionCounts = consultantIds.length > 0
            ? await prisma.$queryRaw`
                SELECT c.consultant_id as "consultantId", COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${Prisma.join(consultantIds)})
                  AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `
            : [];

        // 4. Fetch Completed Tasks this month in bulk
        const completedTaskCounts = await prisma.agendaItem.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: consultantIds },
                status: 'completed',
                start_at: { gte: startOfMonth }
            },
            _count: { id: true }
        });

        // Helper maps for quick lookup
        const propMap = {};
        propertyCounts.forEach(pc => {
            if (!propMap[pc.assigned_user_id]) propMap[pc.assigned_user_id] = {};
            propMap[pc.assigned_user_id][pc.listing_type] = pc._count.id;
        });

        const newPortfolioMap = {};
        newPortfolioCounts.forEach(npc => {
            newPortfolioMap[npc.assigned_user_id] = npc._count.id;
        });

        const interactionMap = {};
        interactionCounts.forEach(ic => {
            interactionMap[ic.consultantId] = ic.count;
        });

        const taskMap = {};
        completedTaskCounts.forEach(ctc => {
            taskMap[ctc.user_id] = ctc._count.id;
        });

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propMap[c.id]?.sale || 0,
                active_rent: propMap[c.id]?.rent || 0,
                new_portfolio_monthly: newPortfolioMap[c.id] || 0,
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

        const sixMonthsAgo = months[0].start;

        // Fetch all properties in the last 6 months for this consultant
        const properties = await prisma.property.findMany({
            where: {
                assigned_user_id: consultantId,
                created_at: { gte: sixMonthsAgo }
            },
            select: { created_at: true }
        });

        // Fetch all interactions in the last 6 months for this consultant
        const interactions = await prisma.interaction.findMany({
            where: {
                client: { consultant_id: consultantId },
                date: { gte: sixMonthsAgo }
            },
            select: { date: true }
        });

        const monthlyStats = months.map(m => {
            const propCount = properties.filter(p =>
                p.created_at >= m.start && p.created_at <= m.end
            ).length;

            const intCount = interactions.filter(i =>
                i.date >= m.start && i.date <= m.end
            ).length;

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
