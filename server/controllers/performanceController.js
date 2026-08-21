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

        // ⚡ Bolt: Resolving N+1 queries by grouping counts in memory instead of looping
        const consultantIds = consultants.map(c => c.id);

        const [
            propertiesSaleGroup,
            propertiesRentGroup,
            propertiesNewGroup,
            interactionsRaw,
            agendaGroups
        ] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'sale' },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'rent' },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: { in: consultantIds } },
                    date: { gte: startOfMonth }
                },
                select: { client: { select: { consultant_id: true } } }
            }),
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        const saleCountsMap = Object.fromEntries(propertiesSaleGroup.filter(g => g.assigned_user_id).map(g => [g.assigned_user_id, g._count.id]));
        const rentCountsMap = Object.fromEntries(propertiesRentGroup.filter(g => g.assigned_user_id).map(g => [g.assigned_user_id, g._count.id]));
        const newPortfolioMap = Object.fromEntries(propertiesNewGroup.filter(g => g.assigned_user_id).map(g => [g.assigned_user_id, g._count.id]));
        const agendaCountsMap = Object.fromEntries(agendaGroups.filter(g => g.user_id).map(g => [g.user_id, g._count.id]));

        const interactionCountsMap = {};
        for (const i of interactionsRaw) {
            const cid = i.client?.consultant_id;
            if (cid) {
                interactionCountsMap[cid] = (interactionCountsMap[cid] || 0) + 1;
            }
        }

        const performanceData = consultants.map(c => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: saleCountsMap[c.id] || 0,
                    active_rent: rentCountsMap[c.id] || 0,
                    new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                    interactions_monthly: interactionCountsMap[c.id] || 0,
                    completed_tasks_monthly: agendaCountsMap[c.id] || 0
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
