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

        // ⚡ Bolt Optimization: Replaced N+1 nested queries inside the consultant map with batched aggregate queries.
        // This reduces 5 queries per consultant down to 4 aggregate queries overall.
        const [propertiesByListingType, newPortfolios, completedTasks, clientInteractions] = await Promise.all([
            // Count Sale and Rent listings
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: { in: ['sale', 'rent'] } },
                _count: { _all: true }
            }),
            // New portfolios (Properties assigned this month)
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { _all: true }
            }),
            // Completed Agenda tasks
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { _all: true }
            }),
            // Interactions made (via clients assigned to them)
            prisma.client.findMany({
                where: { consultant_id: { in: consultantIds } },
                select: {
                    consultant_id: true,
                    _count: {
                        select: {
                            interactions: {
                                where: { date: { gte: startOfMonth } }
                            }
                        }
                    }
                }
            })
        ]);

        const saleMap = new Map();
        const rentMap = new Map();
        propertiesByListingType.forEach(p => {
            if (p.assigned_user_id) {
                if (p.listing_type === 'sale') saleMap.set(p.assigned_user_id, p._count._all);
                if (p.listing_type === 'rent') rentMap.set(p.assigned_user_id, p._count._all);
            }
        });

        const newPortfolioMap = new Map();
        newPortfolios.forEach(p => {
            if (p.assigned_user_id) newPortfolioMap.set(p.assigned_user_id, p._count._all);
        });

        const completedTasksMap = new Map();
        completedTasks.forEach(t => {
            if (t.user_id) completedTasksMap.set(t.user_id, t._count._all);
        });

        const interactionMap = new Map();
        clientInteractions.forEach(c => {
            if (c.consultant_id) {
                interactionMap.set(c.consultant_id, (interactionMap.get(c.consultant_id) || 0) + c._count.interactions);
            }
        });

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: saleMap.get(c.id) || 0,
                active_rent: rentMap.get(c.id) || 0,
                new_portfolio_monthly: newPortfolioMap.get(c.id) || 0,
                interactions_monthly: interactionMap.get(c.id) || 0,
                completed_tasks_monthly: completedTasksMap.get(c.id) || 0
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
