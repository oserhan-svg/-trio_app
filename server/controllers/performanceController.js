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

        const performanceData = await Promise.all(consultants.map(async (c) => {
            // ⚡ Bolt: Use groupBy to consolidate property counts and Promise.all to fetch remaining stats concurrently
            const [propertyStats, newPortfolioCount, interactionCount, completedTasks] = await Promise.all([
                prisma.property.groupBy({
                    by: ['listing_type'],
                    where: { assigned_user_id: c.id },
                    _count: { _all: true }
                }),
                prisma.property.count({
                    where: { assigned_user_id: c.id, created_at: { gte: startOfMonth } }
                }),
                prisma.interaction.count({
                    where: { client: { consultant_id: c.id }, date: { gte: startOfMonth } }
                }),
                prisma.agendaItem.count({
                    where: { user_id: c.id, status: 'completed', start_at: { gte: startOfMonth } }
                })
            ]);

            const saleCount = propertyStats.find(p => p.listing_type === 'sale')?._count?._all || 0;
            const rentCount = propertyStats.find(p => p.listing_type === 'rent')?._count?._all || 0;

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

        const monthlyStats = await Promise.all(months.map(async (m) => {
            // ⚡ Bolt: Fetch month stats concurrently to avoid sequential database latency
            const [propertiesCount, interactionsCount] = await Promise.all([
                prisma.property.count({
                    where: {
                        assigned_user_id: consultantId,
                        created_at: { gte: m.start, lte: m.end }
                    }
                }),
                prisma.interaction.count({
                    where: {
                        client: { consultant_id: consultantId },
                        date: { gte: m.start, lte: m.end }
                    }
                })
            ]);

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
