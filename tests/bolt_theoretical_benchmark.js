// Mocking Prisma to measure logic/overhead, not the actual DB time
// Since actual DB is not available, we measure "round-trip reduction" theoretically
// but we'll try to simulate the call overhead.

const analyticsService = {
    getNeighborhoodStatsMap: async () => new Promise(r => setTimeout(() => r({}), 50)),
    getSupplyDemandStats: async () => new Promise(r => setTimeout(() => r({}), 30)),
};

const prisma = {
    property: {
        count: async () => new Promise(r => setTimeout(() => r(100), 20))
    }
};

async function benchmarkOld() {
    console.log('--- Benchmarking OLD (Simulated) ---');
    const start = Date.now();
    await analyticsService.getNeighborhoodStatsMap();
    await analyticsService.getSupplyDemandStats();
    await prisma.property.count();
    await prisma.property.count();
    await prisma.property.count();
    await prisma.property.count();
    await prisma.property.count();
    const end = Date.now();
    console.log(`Old logic took ~${end - start}ms (with 50+30+20*5 = 180ms expected latency)`);
}

async function benchmarkNew() {
    console.log('\n--- Benchmarking NEW (Simulated) ---');
    const start = Date.now();
    // Parallelize service calls and consolidate counts (1 combined query)
    await Promise.all([
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getSupplyDemandStats(),
        new Promise(r => setTimeout(() => r([100, 20, 30, 10, 40]), 25)) // Combined query
    ]);
    const end = Date.now();
    console.log(`New logic took ~${end - start}ms (with max(50, 30, 25) = 50ms expected latency)`);
}

async function run() {
    await benchmarkOld();
    await benchmarkNew();
}

run();
