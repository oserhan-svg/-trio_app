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

        const propertiesGrouped = await prisma.property.groupBy({
            by: ['assigned_user_id', 'listing_type'],
            where: { assigned_user_id: { in: consultantIds } },
            _count: { _all: true }
        });

        const newPortfoliosGrouped = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: {
                assigned_user_id: { in: consultantIds },
                created_at: { gte: startOfMonth }
            },
            _count: { _all: true }
        });

        const clientConsultantMapRaw = await prisma.client.findMany({
            where: { consultant_id: { in: consultantIds } },
            select: { id: true, consultant_id: true }
        });
        const clientConsultantMap = clientConsultantMapRaw.map(c => ({
            id: c.id,
            consultant_id: c.consultant_id
        }));
        const clientIds = clientConsultantMap.map(c => c.id);

        const interactionsGrouped = await prisma.interaction.groupBy({
            by: ['client_id'],
            where: {
                client_id: { in: clientIds },
                date: { gte: startOfMonth }
            },
            _count: { _all: true }
        });

        const consultantInteractionCounts = {};
        interactionsGrouped.forEach(ig => {
            const consultantId = clientConsultantMap.find(c => c.id === ig.client_id)?.consultant_id;
            if (consultantId) {
                consultantInteractionCounts[consultantId] = (consultantInteractionCounts[consultantId] || 0) + ig._count._all;
            }
        });

        const completedTasksGrouped = await prisma.agendaItem.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: consultantIds },
                status: 'completed',
                start_at: { gte: startOfMonth }
            },
            _count: { _all: true }
        });

        const performanceData = consultants.map((c) => {
            const cProps = propertiesGrouped.filter(p => p.assigned_user_id === c.id);
            const saleCount = cProps.find(p => p.listing_type === 'sale')?._count._all || 0;
            const rentCount = cProps.find(p => p.listing_type === 'rent')?._count._all || 0;

            const newPortfolioCount = newPortfoliosGrouped.find(p => p.assigned_user_id === c.id)?._count._all || 0;

            const interactionCount = consultantInteractionCounts[c.id] || 0;

            const completedTasks = completedTasksGrouped.find(t => t.user_id === c.id)?._count._all || 0;

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

        const monthlyStats = await Promise.all(months.map(async (m) => {
            const propertiesCount = await prisma.property.count({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: m.start, lte: m.end }
                }
            });

            const interactionsCount = await prisma.interaction.count({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: m.start, lte: m.end }
                }
            });

            return {
                name: m.name,
                portföy: propertiesCount,
                etkileşim: interactionsCount
            };
        }));

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
