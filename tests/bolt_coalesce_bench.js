const prisma = require('../server/db');
const analyticsService = require('../server/services/analyticsService');

async function benchmark() {
    console.log('⚡ Bolt Benchmark: Cache Stampede Detection');

    // 1. Mock Prisma property.groupBy to track calls and add latency
    let groupByCalls = 0;
    prisma.property.groupBy = async () => {
        groupByCalls++;
        // Simulate DB latency
        await new Promise(resolve => setTimeout(resolve, 200));
        return [];
    };

    // 2. Clear cache
    analyticsService.cache.statsMap = null;
    analyticsService.cache.lastFetch = 0;

    console.log('\n--- Test 1: getNeighborhoodStatsMap Concurrent Calls ---');
    const start1 = Date.now();
    await Promise.all([
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap()
    ]);
    const duration1 = Date.now() - start1;
    console.log(`Total GroupBy Calls: ${groupByCalls}`);
    console.log(`Duration: ${duration1}ms`);

    // 3. Mock other methods for getBIDashboard
    // calculatePipelineVelocity calls prisma.clientInteraction.findMany (which is bugged, but we will mock it)
    // Actually it currently calls prisma.clientInteraction.findMany
    prisma.clientInteraction = prisma.clientInteraction || {};
    prisma.clientInteraction.findMany = async () => {
        return [];
    };

    // Mocking others to avoid real DB hits or errors
    prisma.deal = { findMany: async () => [] };
    prisma.user = { findMany: async () => [] };
    prisma.client = { groupBy: async () => [] };
    prisma.whatsAppMessage = { findMany: async () => [] };

    // Track total calls in getBIDashboard
    let biCalls = 0;
    const originalGetBIDashboard = analyticsService.getBIDashboard.bind(analyticsService);

    // Clear BI cache
    analyticsService.biCache.data = null;
    analyticsService.biCache.lastFetch = 0;

    console.log('\n--- Test 2: getBIDashboard Concurrent Calls ---');
    // We can't easily track internal calls without deeper mocking,
    // but we can see if multiple "📈 Generating BI Predictive Dashboard..." logs appear.
    // Or we can mock the internal methods.

    let calculatePipelineVelocityCalls = 0;
    const originalCPV = analyticsService.calculatePipelineVelocity;
    analyticsService.calculatePipelineVelocity = async () => {
        calculatePipelineVelocityCalls++;
        await new Promise(resolve => setTimeout(resolve, 200));
        return originalCPV.apply(analyticsService);
    };

    await Promise.all([
        analyticsService.getBIDashboard(),
        analyticsService.getBIDashboard(),
        analyticsService.getBIDashboard()
    ]);

    console.log(`Total calculatePipelineVelocity Calls: ${calculatePipelineVelocityCalls}`);

    if (groupByCalls > 1 || calculatePipelineVelocityCalls > 1) {
        console.log('\n❌ VULNERABILITY DETECTED: Multiple DB/Service calls for concurrent requests (Cache Stampede).');
    } else {
        console.log('\n✅ OPTIMIZED: Promise coalescing is working.');
    }
}

benchmark().catch(console.error).finally(() => process.exit(0));
