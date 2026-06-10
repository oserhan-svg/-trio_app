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

        // Batch queries to prevent N+1 overhead
        const [
            propertiesByType,
            newPropertiesByMonth,
            completedAgendaItems,
            interactionsByClient
        ] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            prisma.interaction.findMany({
                where: { date: { gte: startOfMonth }, client: { consultant_id: { in: consultantIds } } },
                select: { client: { select: { consultant_id: true } } }
            })
        ]);

        // Map aggregated results by consultant id
        const propertyTypeMap = propertiesByType.reduce((acc, curr) => {
            if (!acc[curr.assigned_user_id]) acc[curr.assigned_user_id] = { sale: 0, rent: 0 };
            acc[curr.assigned_user_id][curr.listing_type] = curr._count.id;
            return acc;
        }, {});

        const newPortfolioMap = newPropertiesByMonth.reduce((acc, curr) => {
            acc[curr.assigned_user_id] = curr._count.id;
            return acc;
        }, {});

        const completedTasksMap = completedAgendaItems.reduce((acc, curr) => {
            acc[curr.user_id] = curr._count.id;
            return acc;
        }, {});

        const interactionMap = interactionsByClient.reduce((acc, curr) => {
            const cid = curr.client?.consultant_id;
            if (cid) acc[cid] = (acc[cid] || 0) + 1;
            return acc;
        }, {});

        const performanceData = consultants.map(c => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: propertyTypeMap[c.id]?.sale || 0,
                    active_rent: propertyTypeMap[c.id]?.rent || 0,
                    new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                    interactions_monthly: interactionMap[c.id] || 0,
                    completed_tasks_monthly: completedTasksMap[c.id] || 0
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
