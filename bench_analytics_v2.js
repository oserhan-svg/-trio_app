const prisma = require('./server/db');
const analyticsService = require('./server/services/analyticsService');

async function benchmark() {
    try {
        console.log('--- Benchmarking Analytics ---');
        const start = Date.now();
        const stats = await analyticsService.getNeighborhoodStatsMap();
        const end = Date.now();
        console.log('Time taken:', (end - start), 'ms');
        console.log('Neighborhood Count:', Object.keys(stats).length);

        console.log('\n--- Benchmarking Analytics (Second Call - Cached) ---');
        const start2 = Date.now();
        await analyticsService.getNeighborhoodStatsMap();
        const end2 = Date.now();
        console.log('Time taken (Cached):', (end2 - start2), 'ms');

    } catch (error) {
        console.error('Benchmark Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
