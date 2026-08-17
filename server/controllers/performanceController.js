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

        const consultantIds = consultants.map(c => c.id);

        // ⚡ Bolt: Removed N+1 queries by batching aggregations using groupBy for count metrics across all consultants
        const [saleCounts, rentCounts, newPortfolioCounts, interactions, completedTasks] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'sale' },
                _count: { assigned_user_id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'rent' },
                _count: { assigned_user_id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { assigned_user_id: true }
            }),
            prisma.interaction.findMany({
                where: { client: { consultant_id: { in: consultantIds } }, date: { gte: startOfMonth } },
                select: { client: { select: { consultant_id: true } } }
            }),
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { user_id: true }
            })
        ]);

        const saleMap = Object.fromEntries(saleCounts.map(x => [x.assigned_user_id, x._count.assigned_user_id]));
        const rentMap = Object.fromEntries(rentCounts.map(x => [x.assigned_user_id, x._count.assigned_user_id]));
        const portfolioMap = Object.fromEntries(newPortfolioCounts.map(x => [x.assigned_user_id, x._count.assigned_user_id]));
        const agendaMap = Object.fromEntries(completedTasks.map(x => [x.user_id, x._count.user_id]));

        const interactionMap = {};
        for (const i of interactions) {
            if (i.client && i.client.consultant_id) {
                interactionMap[i.client.consultant_id] = (interactionMap[i.client.consultant_id] || 0) + 1;
            }
        }

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: saleMap[c.id] || 0,
                active_rent: rentMap[c.id] || 0,
                new_portfolio_monthly: portfolioMap[c.id] || 0,
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

        const startDate = months[months.length - 1].start;
        const endDate = months[0].end;

        const [properties, interactions] = await Promise.all([
            prisma.property.findMany({
                where: { assigned_user_id: consultantId, created_at: { gte: startDate, lte: endDate } },
                select: { created_at: true }
            }),
            prisma.interaction.findMany({
                where: { client: { consultant_id: consultantId }, date: { gte: startDate, lte: endDate } },
                select: { date: true }
            })
        ]);

        // ⚡ Bolt: Removed N+1 queries by fetching a bulk list over the complete date range and binning by month.
        const monthlyStats = months.map(m => {
            const propertiesCount = properties.filter(p => p.created_at >= m.start && p.created_at <= m.end).length;
            const interactionsCount = interactions.filter(i => i.date >= m.start && i.date <= m.end).length;
            return {
                name: m.name,
                portföy: propertiesCount,
                etkileşim: interactionsCount
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
