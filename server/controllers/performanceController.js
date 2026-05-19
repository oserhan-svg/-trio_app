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

        // Optimized Bulk Queries (O(1) database complexity)
        const [propertyStats, newPortfolios, interactionStats, agendaStats] = await Promise.all([
            // 1. Get Sale/Rent counts for all consultants
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. Get monthly new portfolio counts
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: {
                    assigned_user_id: { in: consultantIds },
                    created_at: { gte: startOfMonth }
                },
                _count: { id: true }
            }),
            // 3. Get monthly interaction counts (via Raw Query due to nested relation in groupBy)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.date >= ${startOfMonth} AND c.consultant_id IN (${Prisma.join(consultantIds)})
                GROUP BY c.consultant_id
            `,
            // 4. Get monthly completed tasks
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

        // Map stats for O(1) lookup
        const propMap = {};
        propertyStats.forEach(s => {
            if (!propMap[s.assigned_user_id]) propMap[s.assigned_user_id] = { sale: 0, rent: 0 };
            if (s.listing_type === 'sale') propMap[s.assigned_user_id].sale = s._count.id;
            if (s.listing_type === 'rent') propMap[s.assigned_user_id].rent = s._count.id;
        });

        const newPortMap = Object.fromEntries(newPortfolios.map(s => [s.assigned_user_id, s._count.id]));
        const intMap = Object.fromEntries(interactionStats.map(s => [s.consultant_id, s.count]));
        const taskMap = Object.fromEntries(agendaStats.map(s => [s.user_id, s._count.id]));

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

        // Optimized Bulk Queries for details (O(1) database complexity)
        const startDate = months[0].start;
        const [propStats, intStats] = await Promise.all([
            prisma.$queryRaw`
                SELECT EXTRACT(MONTH FROM created_at)::int as month, EXTRACT(YEAR FROM created_at)::int as year, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startDate}
                GROUP BY year, month
            `,
            prisma.$queryRaw`
                SELECT EXTRACT(MONTH FROM i.date)::int as month, EXTRACT(YEAR FROM i.date)::int as year, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startDate}
                GROUP BY year, month
            `
        ]);

        const propMonthMap = Object.fromEntries(propStats.map(s => [`${s.year}-${s.month}`, s.count]));
        const intMonthMap = Object.fromEntries(intStats.map(s => [`${s.year}-${s.month}`, s.count]));

        const monthlyStats = months.map(m => {
            const key = `${m.year}-${m.month + 1}`; // JS months are 0-11, SQL EXTRACT is 1-12
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
