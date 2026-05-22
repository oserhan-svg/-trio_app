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

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const consultantIds = consultants.map(c => c.id);

        // Optimized Bulk Queries (Eliminating N+1)
        const [propertyStats, newPortfolioStats, interactionStats, agendaStats] = await Promise.all([
            // 1. Sale/Rent counts for all consultants
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { _all: true }
            }),
            // 2. New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { _all: true }
            }),
            // 3. Interactions via SQL (JOIN required)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth} AND c.consultant_id IN (${consultantIds.length > 0 ? Prisma.join(consultantIds) : 0})
                GROUP BY c.consultant_id
            `,
            // 4. Completed Agenda tasks
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultantIds },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            })
        ]);

        // Map results for O(1) lookup
        const propMap = {};
        propertyStats.forEach(s => {
            if (!propMap[s.assigned_user_id]) propMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            propMap[s.assigned_user_id][s.listing_type] = s._count._all;
        });

        const newPortMap = Object.fromEntries(newPortfolioStats.map(s => [s.assigned_user_id, s._count._all]));
        const intMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const agendaMap = Object.fromEntries(agendaStats.map(s => [s.user_id, s._count.id]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propMap[c.id]?.sale || 0,
                active_rent: propMap[c.id]?.rent || 0,
                new_portfolio_monthly: newPortMap[c.id] || 0,
                interactions_monthly: intMap[c.id] || 0,
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
                month: d.getMonth() + 1, // 1-indexed for SQL matching
                year: d.getFullYear()
            });
        }

        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // Optimized Time-Series Queries (Eliminating N+1)
        const [propSeries, intSeries] = await Promise.all([
            prisma.$queryRaw`
                SELECT EXTRACT(YEAR FROM created_at)::int as year, EXTRACT(MONTH FROM created_at)::int as month, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${sixMonthsAgo}
                GROUP BY 1, 2
            `,
            prisma.$queryRaw`
                SELECT EXTRACT(YEAR FROM i.date)::int as year, EXTRACT(MONTH FROM i.date)::int as month, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${sixMonthsAgo}
                GROUP BY 1, 2
            `
        ]);

        // Helper for quick lookup
        const seriesToMap = (series) => Object.fromEntries(series.map(s => [`${s.year}-${s.month}`, s.count]));
        const propMap = seriesToMap(propSeries);
        const intMap = seriesToMap(intSeries);

        const monthlyStats = months.map(m => ({
            name: m.name,
            portföy: propMap[`${m.year}-${m.month}`] || 0,
            etkileşim: intMap[`${m.year}-${m.month}`] || 0
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
