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
        if (consultantIds.length === 0) return res.json([]);

        // Optimized Bulk Queries to eliminate N+1
        const [typeCounts, newPortfolioCounts, interactionCounts, taskCounts] = await Promise.all([
            // 1. Bulk Sale/Rent counts
            prisma.property.groupBy({
                by: ['assigned_user_id', 'listing_type'],
                where: { assigned_user_id: { in: consultantIds } },
                _count: { id: true }
            }),
            // 2. Bulk New portfolio counts (this month)
            prisma.property.groupBy({
                by: ['assigned_user_id'],
                where: { assigned_user_id: { in: consultantIds }, created_at: { gte: startOfMonth } },
                _count: { id: true }
            }),
            // 3. Bulk Interactions via SQL join (since Interaction doesn't have consultant_id directly)
            prisma.$queryRaw`
                SELECT c.consultant_id, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id IN (${consultantIds})
                AND i.date >= ${startOfMonth}
                GROUP BY c.consultant_id
            `,
            // 4. Bulk Task counts
            prisma.agendaItem.groupBy({
                by: ['user_id'],
                where: { user_id: { in: consultantIds }, status: 'completed', start_at: { gte: startOfMonth } },
                _count: { id: true }
            })
        ]);

        // Map results for O(1) lookups
        const typeMap = new Map(typeCounts.map(i => [`${i.assigned_user_id}-${i.listing_type}`, i._count.id]));
        const portfolioMap = new Map(newPortfolioCounts.map(i => [i.assigned_user_id, i._count.id]));
        const interactionMap = new Map(interactionCounts.map(i => [i.consultant_id, i.count]));
        const taskMap = new Map(taskCounts.map(i => [i.user_id, i._count.id]));

        const performanceData = consultants.map((c) => ({
            id: c.id,
            email: c.email,
            name: c.name,
            stats: {
                total_clients: c._count.clients,
                active_sale: typeMap.get(`${c.id}-sale`) || 0,
                active_rent: typeMap.get(`${c.id}-rent`) || 0,
                new_portfolio_monthly: portfolioMap.get(c.id) || 0,
                interactions_monthly: interactionMap.get(c.id) || 0,
                completed_tasks_monthly: taskMap.get(c.id) || 0
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

        const startDate = months[0].start;

        // Bulk Monthly Stats using $queryRaw to group by month
        const [propertyMonthly, interactionMonthly] = await Promise.all([
            prisma.$queryRaw`
                SELECT TO_CHAR(created_at, 'YYYY-MM') as month_key, COUNT(*)::int as count
                FROM properties
                WHERE assigned_user_id = ${consultantId} AND created_at >= ${startDate}
                GROUP BY 1
            `,
            prisma.$queryRaw`
                SELECT TO_CHAR(i.date, 'YYYY-MM') as month_key, COUNT(i.id)::int as count
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE c.consultant_id = ${consultantId} AND i.date >= ${startDate}
                GROUP BY 1
            `
        ]);

        const propertyMap = new Map(propertyMonthly.map(i => [i.month_key, i.count]));
        const interactionMap = new Map(interactionMonthly.map(i => [i.month_key, i.count]));

        const monthlyStats = months.map(m => {
            const monthKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            return {
                name: m.name,
                portföy: propertyMap.get(monthKey) || 0,
                etkileşim: interactionMap.get(monthKey) || 0
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
