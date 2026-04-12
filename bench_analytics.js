const prisma = require('./server/db');
const analyticsService = require('./server/services/analyticsService');

async function benchmark() {
    try {
        console.log('--- Benchmarking Analytics ---');

        console.log('1. Testing getNeighborhoodStatsMap (with cache check)...');
        const start = Date.now();
        const stats = await analyticsService.getNeighborhoodStatsMap();
        const end = Date.now();
        console.log('Time taken:', (end - start), 'ms');
        console.log('Neighborhood Count:', Object.keys(stats).length);

        if (analyticsService.getGlobalCounts) {
            console.log('\n2. Testing getGlobalCounts (Optimized bulk query)...');
            const gStart = Date.now();
            const counts = await analyticsService.getGlobalCounts();
            const gEnd = Date.now();
            console.log('Time taken:', (gEnd - gStart), 'ms');
            console.log('Counts:', counts);
        }

    } catch (error) {
        console.error('Benchmark Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
