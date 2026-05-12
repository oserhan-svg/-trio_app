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

        // Bulk fetch stats to avoid N+1 problem
        const [propertyStats, newPortfolioStats, taskStats, interactionStats] = await Promise.all([
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultantIds },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            // Use queryRaw for complex join aggregation
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds.length > 0 ? consultantIds : [0]})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `
        ]);

        const getCount = (stats, userId, userIdField, filter = {}) => {
            const found = stats.find(s => {
                const matchesUser = (s[userIdField]) === userId;
                if (!matchesUser) return false;
                return Object.keys(filter).every(key => s[key] === filter[key]);
            });
            if (!found) return 0;
            return found._count ? found._count.id : (found.count || 0);
        };

        const performanceData = consultants.map((c) => {
            return {
                id: c.id,
                email: c.email,
                name: c.name,
                stats: {
                    total_clients: c._count.clients,
                    active_sale: getCount(propertyStats, c.id, 'assigned_user_id', { listing_type: 'sale' }),
                    active_rent: getCount(propertyStats, c.id, 'assigned_user_id', { listing_type: 'rent' }),
                    new_portfolio_monthly: getCount(newPortfolioStats, c.id, 'assigned_user_id'),
                    interactions_monthly: getCount(interactionStats, c.id, 'consultant_id'),
                    completed_tasks_monthly: getCount(taskStats, c.id, 'user_id')
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

        const startOfHistory = months[0].start;

        const [monthlyProperties, monthlyInteractions] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'Month') as month_name, COUNT(id)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId}
                AND created_at >= ${startOfHistory}
                GROUP BY TO_CHAR(created_at, 'Month')
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'Month') as month_name, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId}
                AND i.date >= ${startOfHistory}
                GROUP BY TO_CHAR(i.date, 'Month')
            `
        ]);

        const monthlyStats = months.map(m => {
            const pMatch = monthlyProperties.find(p => p.month_name.trim().toLowerCase() === m.name.toLowerCase());
            const iMatch = monthlyInteractions.find(i => i.month_name.trim().toLowerCase() === m.name.toLowerCase());

            return {
                name: m.name,
                portföy: pMatch ? pMatch.count : 0,
                etkileşim: iMatch ? iMatch.count : 0
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
