const cacheService = require('../server/services/cacheService');
const analyticsService = require('../server/services/analyticsService');

async function test() {
    console.log('--- Testing CacheService Coalescing ---');
    let calls = 0;
    const fetcher = async () => {
        calls++;
        await new Promise(r => setTimeout(r, 50));
        return { data: 'ok' };
    };

    const [r1, r2] = await Promise.all([
        cacheService.getOrSet('logic-test', fetcher),
        cacheService.getOrSet('logic-test', fetcher)
    ]);

    console.log('Results match:', JSON.stringify(r1) === JSON.stringify(r2));
    console.log('Calls (should be 1):', calls);

    if (calls !== 1) throw new Error('Coalescing failed');

    console.log('\n--- Testing AnalyticsService Method Signatures ---');
    console.log('getBIDashboard is function:', typeof analyticsService.getBIDashboard === 'function');
    console.log('getNeighborhoodStatsMap is function:', typeof analyticsService.getNeighborhoodStatsMap === 'function');

    // Check that local cache objects are gone
    console.log('Local cache object removed:', analyticsService.cache === undefined);
    console.log('Local biCache object removed:', analyticsService.biCache === undefined);

    console.log('\n✅ Logic verification passed!');
}

test().catch(err => {
    console.error('❌ Logic verification failed:', err);
    process.exit(1);
});
