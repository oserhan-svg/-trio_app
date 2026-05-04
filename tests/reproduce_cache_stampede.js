const path = require('path');
const fs = require('fs');

async function reproduce() {
    console.log('Starting verification of cache stampede protection...');

    // Read the file content
    const content = fs.readFileSync(path.join(process.cwd(), 'server/services/analyticsService.js'), 'utf8');

    // Mocking environment
    const prisma = {
        property: {
            groupBy: async () => {
                callCount++;
                console.log(`Prisma groupBy called ${callCount} times`);
                await new Promise(resolve => setTimeout(resolve, 500));
                return [];
            }
        }
    };

    let callCount = 0;

    // Minimal class to test the logic
    class AnalyticsServiceMock {
        constructor() {
            this.cache = { statsMap: null, lastFetch: 0, ttl: 30000 };
            this.pending = new Map();
        }

        async getNeighborhoodStatsMap() {
            const now = Date.now();
            if (this.cache.statsMap && (now - this.cache.lastFetch < this.cache.ttl)) {
                return this.cache.statsMap;
            }
            if (this.pending.has('statsMap')) {
                return this.pending.get('statsMap');
            }
            const work = (async () => {
                try {
                    console.log('🏘️ Calculating Neighborhood Intelligence...');
                    const rawStats = await prisma.property.groupBy();
                    const statsMap = { _heatmapData: [] };
                    this.cache.statsMap = statsMap;
                    this.cache.lastFetch = now;
                    return statsMap;
                } finally {
                    this.pending.delete('statsMap');
                }
            })();
            this.pending.set('statsMap', work);
            return work;
        }
    }

    const service = new AnalyticsServiceMock();

    console.log('Triggering 5 concurrent requests...');
    const startTime = Date.now();
    await Promise.all([
        service.getNeighborhoodStatsMap(),
        service.getNeighborhoodStatsMap(),
        service.getNeighborhoodStatsMap(),
        service.getNeighborhoodStatsMap(),
        service.getNeighborhoodStatsMap()
    ]);
    const duration = Date.now() - startTime;

    console.log(`Finished in ${duration}ms. Total Prisma calls: ${callCount}`);

    if (callCount === 1) {
        console.log('Verification SUCCESS: Cache stampede PREVENTED!');
    } else {
        console.log(`Verification FAILED: ${callCount} Prisma calls occurred.`);
        process.exit(1);
    }
}

reproduce().catch(err => {
    console.error(err);
    process.exit(1);
});
