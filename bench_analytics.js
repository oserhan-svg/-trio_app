const prisma = require('./server/db');
const { getNeighborhoodStatsMap } = require('./server/services/analyticsService');

async function benchmark() {
    try {
        console.log('--- Benchmarking Analytics ---');
        const start = Date.now();
        const stats = await getNeighborhoodStatsMap();
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
