const analyticsService = require('../server/services/analyticsService');
const prisma = require('../server/db');

// Mock Prisma groupBy to be slow
const originalGroupBy = prisma.property.groupBy;
prisma.property.groupBy = async (...args) => {
    // console.log('Mocked groupBy called');
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        {
            district: 'Test',
            neighborhood: 'Test',
            _avg: { price: 1000000 },
            _count: { id: 10 },
            _min: { price: 500000 },
            _max: { price: 1500000 }
        }
    ];
};

async function reproduce() {
    console.log('--- Starting Reproduction ---');

    // Clear cache
    analyticsService.cache.statsMap = null;
    analyticsService.cache.lastFetch = 0;

    console.log('Calling getNeighborhoodStatsMap 3 times concurrently...');
    const startTime = Date.now();

    // We expect "🏘️ Calculating Neighborhood Intelligence..." to be logged 3 times before fix
    const promises = [
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap()
    ];

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`Duration: ${duration}ms`);
    console.log('--- Reproduction Finished ---');

    // Restore original
    prisma.property.groupBy = originalGroupBy;
}

reproduce().catch(err => {
    console.error(err);
    process.exit(1);
});
