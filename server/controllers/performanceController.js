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

        // OPTIMIZATION: Fetch all counts in bulk to avoid N+1 query problem (O(1) instead of O(N))
        const [propertyStats, newPortfolioStats, interactionStats, taskStats] = await Promise.all([
            // Active Sale/Rent counts
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultants.map(c => c.id) } },
                _count: { id: true }
            }),
            // New portfolios this month
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultants.map(c => c.id) },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            // Interactions this month (requires join)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth}
                AND c.consultant_id IN (${Prisma.join(consultants.map(c => c.id).length > 0 ? consultants.map(c => c.id) : [-1])})
                GROUP BY c.consultant_id
            `,
            // Completed tasks this month
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: {
                    user_id: { in: consultants.map(c => c.id) },
                    status: 'completed',
                    start_at: { gte: startOfMonth }
                },
                _count: { id: true }
            })
        ]);

        // Create lookup maps for fast access
        const propMap = {};
        propertyStats.forEach(s => {
            if (!propMap[s.assigned_user_id]) propMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            propMap[s.assigned_user_id][s.listing_type] = s._count.id;
        });

        const newPortfolioMap = Object.fromEntries(newPortfolioStats.map(s => [s.assigned_user_id, s._count.id]));
        const interactionMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const taskMap = Object.fromEntries(taskStats.map(s => [s.user_id, s._count.id]));

        const performanceData = consultants.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: propMap[c.id]?.sale || 0,
                active_rent: propMap[c.id]?.rent || 0,
                new_portfolio_monthly: newPortfolioMap[c.id] || 0,
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

        // OPTIMIZATION: Use raw SQL with EXTRACT to aggregate by month in O(1) query complexity
        const oldestMonth = months[0].start;
        const [propMonthly, interactionMonthly] = await Promise.all([
            prisma.$queryRaw`
                SELECT EXTRACT(MONTH FROM created_at)::int as month, EXTRACT(YEAR FROM created_at)::int as year, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${oldestMonth}
                GROUP BY year, month
            `,
            prisma.$queryRaw`
                SELECT EXTRACT(MONTH FROM i.date)::int as month, EXTRACT(YEAR FROM i.date)::int as year, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${oldestMonth}
                GROUP BY year, month
            `
        ]);

        const propMonthMap = Object.fromEntries(propMonthly.map(s => [`${s.year}-${s.month}`, s.count]));
        const intMonthMap = Object.fromEntries(interactionMonthly.map(s => [`${s.year}-${s.month}`, s.count]));

        const monthlyStats = months.map(m => {
            // SQL EXTRACT MONTH is 1-indexed, JS Date getMonth is 0-indexed
            const key = `${m.year}-${m.month + 1}`;
            return {
                name: m.name,
                portföy: propMonthMap[key] || 0,
                etkileşim: intMonthMap[key] || 0
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
