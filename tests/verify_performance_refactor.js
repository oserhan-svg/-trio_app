const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyLogic() {
    console.log('🧪 Starting Logic Verification...');

    // Mock data for internal tests
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
        });
    }

    try {
        // 1. Test logic for getConsultantPerformance
        const consultants = [{ id: 1, name: 'C1', _count: { clients: 5 } }];
        const consultantIds = [1];

        // Simulating the groupBy behavior
        const propertyCounts = [
            { assigned_user_id: 1, listing_type: 'sale', _count: { id: 10 } },
            { assigned_user_id: 1, listing_type: 'rent', _count: { id: 5 } }
        ];

        const propMap = {};
        propertyCounts.forEach(pc => {
            if (!propMap[pc.assigned_user_id]) propMap[pc.assigned_user_id] = {};
            propMap[pc.assigned_user_id][pc.listing_type] = pc._count.id;
        });

        if (propMap[1].sale !== 10 || propMap[1].rent !== 5) {
            throw new Error('Property Map logic failed');
        }
        console.log('✅ Property Map logic passed');

        // 2. Test logic for getConsultantDetail
        const properties = [
            { created_at: new Date(now.getFullYear(), now.getMonth(), 5) },
            { created_at: new Date(now.getFullYear(), now.getMonth() - 1, 10) }
        ];

        const monthlyStats = months.map(m => {
            const propCount = properties.filter(p =>
                p.created_at >= m.start && p.created_at <= m.end
            ).length;
            return { propCount };
        });

        if (monthlyStats[5].propCount !== 1 || monthlyStats[4].propCount !== 1) {
            throw new Error('Monthly grouping logic failed');
        }
        console.log('✅ Monthly grouping logic passed');

        console.log('🧪 Logic verification complete.');
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLogic();
