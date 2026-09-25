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

        // ⚡ Bolt: Resolve N+1 query bottleneck by batching counts for all consultants into 5 queries total using groupBy and batched findMany
        const [saleGroups, rentGroups, newPortfolioGroups, interactionsRaw, completedTaskGroups] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'sale' },
                _count: { _all: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, listing_type: 'rent' },
                _count: { _all: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { _all: true }
            }),
            prisma.interaction.findMany({
                where: { client: { consultant_id: { in: consultantIds } }, date: { gte: startOfMonth } },
                select: { client: { select: { consultant_id: true } } }
            }),
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { _all: true }
            })
        ]);

        const saleMap = Object.fromEntries(saleGroups.filter(g => g.assigned_user_id != null).map(g => [g.assigned_user_id, g._count._all]));
        const rentMap = Object.fromEntries(rentGroups.filter(g => g.assigned_user_id != null).map(g => [g.assigned_user_id, g._count._all]));
        const newPortfolioMap = Object.fromEntries(newPortfolioGroups.filter(g => g.assigned_user_id != null).map(g => [g.assigned_user_id, g._count._all]));
        const completedTaskMap = Object.fromEntries(completedTaskGroups.filter(g => g.user_id != null).map(g => [g.user_id, g._count._all]));

        const interactionMap = {};
        for (const interaction of interactionsRaw) {
            const cid = interaction.client?.consultant_id;
            if (cid) {
                interactionMap[cid] = (interactionMap[cid] || 0) + 1;
            }
        }

        const performanceData = consultants.map((c) => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: saleMap[c.id] || 0,
                    active_rent: rentMap[c.id] || 0,
                    new_portfolio_monthly: newPortfolioMap[c.id] || 0,
                    interactions_monthly: interactionMap[c.id] || 0,
                    completed_tasks_monthly: completedTaskMap[c.id] || 0
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

        const startDate = months[0].start;
        const endDate = months[months.length - 1].end;

        // ⚡ Bolt: Resolve N+1 bottleneck by replacing map(async) with a single query across the date range and grouping in memory
        const [propertiesRaw, interactionsRaw] = await Promise.all([
            prisma.property.findMany({
                where: {
                    assigned_user_id: consultantId,
                    created_at: { gte: startDate, lte: endDate }
                },
                select: { created_at: true }
            }),
            prisma.interaction.findMany({
                where: {
                    client: { consultant_id: consultantId },
                    date: { gte: startDate, lte: endDate }
                },
                select: { date: true }
            })
        ]);

        const statsMap = {};
        months.forEach(m => {
            statsMap[m.name] = { portföy: 0, etkileşim: 0 };
        });

        propertiesRaw.forEach(p => {
            const pDate = new Date(p.created_at);
            const targetMonth = months.find(m => pDate >= m.start && pDate <= m.end);
            if (targetMonth && statsMap[targetMonth.name]) {
                statsMap[targetMonth.name].portföy++;
            }
        });

        interactionsRaw.forEach(i => {
            const iDate = new Date(i.date);
            const targetMonth = months.find(m => iDate >= m.start && iDate <= m.end);
            if (targetMonth && statsMap[targetMonth.name]) {
                statsMap[targetMonth.name].etkileşim++;
            }
        });

        const monthlyStats = months.map(m => ({
            name: m.name,
            portföy: statsMap[m.name].portföy,
            etkileşim: statsMap[m.name].etkileşim
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
