const prisma = require('../server/db');
const analyticsService = require('../server/services/analyticsService');

async function testLogic() {
    console.log('🧪 Verifying Analytics Service Logic (Mocked DB)');

    // Mock Prisma for calculatePipelineVelocity
    prisma.interaction.findMany = async () => [
        { date: new Date(), client: { created_at: new Date(Date.now() - 86400000) } }
    ];

    // Mock for getRevenueProjection
    prisma.deal.findMany = async () => [
        { status: 'Negotiation', commission: 10000 }
    ];

    // Mock for getConsultantEfficiency
    prisma.user.findMany = async () => [
        { id: 1, name: 'Test User', role: 'consultant', _count: { deals: 1, clients: 10 } }
    ];
    prisma.client.groupBy = async () => [
        { consultant_id: 1, _count: { id: 5 } }
    ];

    // Mock for calculateResponseTimes
    prisma.whatsAppMessage.findMany = async () => [];

    // Mock for getConversionFunnel
    // Already mocked prisma.client.groupBy above, let's refine it for funnel
    const originalGroupBy = prisma.client.groupBy;
    prisma.client.groupBy = async (args) => {
        if (args.by.includes('status')) {
            return [{ status: 'Active', _count: { id: 5 } }, { status: 'Closed Won', _count: { id: 2 } }];
        }
        return originalGroupBy(args);
    };

    try {
        console.log('\n1. Testing getBIDashboard...');
        const dashboard = await analyticsService.getBIDashboard();
        console.log('✅ Dashboard Velocity:', dashboard.velocity);
        console.log('✅ Dashboard Projection:', dashboard.projection);
        console.log('✅ Dashboard Funnel:', dashboard.funnel);

        if (dashboard.velocity.totalCycleTime !== "1.0") {
             throw new Error(`Expected totalCycleTime 1.0, got ${dashboard.velocity.totalCycleTime}`);
        }

        if (dashboard.projection.totalPotential !== 5000) {
            throw new Error(`Expected totalPotential 5000, got ${dashboard.projection.totalPotential}`);
        }

        console.log('\n2. Testing getNeighborhoodStatsMap...');
        prisma.property.groupBy = async () => [
            { district: 'Kadıköy', neighborhood: 'Moda', _avg: { price: 5000000 }, _count: { id: 10 }, _min: { price: 4000000 }, _max: { price: 6000000 } }
        ];
        analyticsService.cache.statsMap = null;
        const stats = await analyticsService.getNeighborhoodStatsMap();
        console.log('✅ Neighborhood Stats (Kadıköy-Moda):', stats['kadıköy-moda']);

        if (stats['kadıköy-moda'].avg !== 5000000) {
            throw new Error(`Expected avg 5000000, got ${stats['kadıköy-moda'].avg}`);
        }

        console.log('\n✨ All logic checks passed!');
    } catch (error) {
        console.error('\n❌ Logic check failed:', error);
        process.exit(1);
    }
}

testLogic().then(() => process.exit(0));
