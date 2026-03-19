const analyticsService = require('./server/services/analyticsService');
const prisma = require('./server/db');

async function benchmark() {
    try {
        console.log('--- Benchmarking Analytics ---');
        const start = Date.now();
        // The service is exported as an instance
        const stats = await analyticsService.getNeighborhoodStatsMap();
        const end = Date.now();
        console.log('Time taken:', (end - start), 'ms');
        console.log('Neighborhood Count:', Object.keys(stats).length);
    } catch (error) {
        console.error('Benchmark Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
