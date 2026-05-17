const prisma = require('../db');
const { Prisma } = require('@prisma/client');

/**
 * ⚡ Optimized getConsultantPerformance
 * Reduced DB complexity from O(N) to O(1) constant queries using bulk aggregations.
 * This prevents N+1 query problems when scaling the number of consultants.
 */
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
        if (consultantIds.length === 0) return res.json([]);

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Bulk fetch all required stats in 4 efficient queries
        const [listingStats, monthlyPortfolios, interactionStats, taskStats] = await Promise.all([
            // 1. Grouped Sale/Rent counts for all consultants
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. New monthly portfolios
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            // 3. Interactions monthly (Joining interactions and clients)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${Prisma.join(consultantIds)})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Completed tasks monthly
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

        // Map stats for O(1) in-memory lookup
        const listingMap = {};
        listingStats.forEach(s => {
            if (!listingMap[s.assigned_user_id]) listingMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            if (s.listing_type === 'sale') listingMap[s.assigned_user_id].sale = s._count.id;
            else if (s.listing_type === 'rent') listingMap[s.assigned_user_id].rent = s._count.id;
        });

        const monthlyPortfolioMap = Object.fromEntries(monthlyPortfolios.map(p => [p.assigned_user_id, p._count.id]));
        const interactionMap = Object.fromEntries(interactionStats.map(i => [i.consultant_id, i.count]));
        const taskMap = Object.fromEntries(taskStats.map(t => [t.user_id, t._count.id]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: listingMap[c.id]?.sale || 0,
                active_rent: listingMap[c.id]?.rent || 0,
                new_portfolio_monthly: monthlyPortfolioMap[c.id] || 0,
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

        /**
         * ⚡ Optimized getConsultantDetail
         * Replaced 12 individual queries with 2 bulk aggregations using raw SQL.
         * Grouping by numeric month/year for locale-independence and speed.
         */
        const sixMonthsAgo = months[0].start;

        const [propertiesStats, interactionsStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT EXTRACT(MONTH FROM created_at)::int as month, EXTRACT(YEAR FROM created_at)::int as year, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId}
                AND created_at >= ${sixMonthsAgo}
                GROUP BY year, month
            `,
            prisma.$queryRaw`
                SELECT EXTRACT(MONTH FROM i.date)::int as month, EXTRACT(YEAR FROM i.date)::int as year, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId}
                AND i.date >= ${sixMonthsAgo}
                GROUP BY year, month
            `
        ]);

        const propMap = {};
        propertiesStats.forEach(s => { propMap[`${s.year}-${s.month}`] = s.count; });

        const intMap = {};
        interactionsStats.forEach(s => { intMap[`${s.year}-${s.month}`] = s.count; });

        const monthlyStats = months.map(m => {
            const key = `${m.year}-${m.month + 1}`;
            return {
                name: m.name,
                portföy: propMap[key] || 0,
                etkileşim: intMap[key] || 0
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
