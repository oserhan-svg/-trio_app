const cacheService = require('../server/services/cacheService');
const assert = require('assert');

async function testCacheCoalescing() {
    console.log('Testing Cache Coalescing...');
    let callCount = 0;
    const fetcher = async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: 'test' };
    };

    const p1 = cacheService.getOrSet('test_key', fetcher);
    const p2 = cacheService.getOrSet('test_key', fetcher);
    const p3 = cacheService.getOrSet('test_key', fetcher);

    const results = await Promise.all([p1, p2, p3]);

    assert.strictEqual(callCount, 1, 'Fetcher should only be called once');
    assert.deepStrictEqual(results[0], { data: 'test' });
    assert.deepStrictEqual(results[1], { data: 'test' });
    assert.deepStrictEqual(results[2], { data: 'test' });

    console.log('✅ Cache Coalescing verified');
}

async function testAnalyticsServiceSignatures() {
    console.log('Testing AnalyticsService signatures (smoke test)...');
    const analyticsService = require('../server/services/analyticsService');

    // We can't run them easily without DB, but we can check if they exist and are functions
    assert.strictEqual(typeof analyticsService.getGlobalCounts, 'function');
    assert.strictEqual(typeof analyticsService.getNeighborhoodStatsMap, 'function');
    assert.strictEqual(typeof analyticsService.getBIDashboard, 'function');
    assert.strictEqual(typeof analyticsService.getSupplyDemandStats, 'function');

    console.log('✅ AnalyticsService signatures verified');
}

async function runTests() {
    try {
        await testCacheCoalescing();
        await testAnalyticsServiceSignatures();
        console.log('\nAll Bolt optimization verifications passed!');
    } catch (err) {
        console.error('❌ Verification FAILED:', err);
        process.exit(1);
    }
}

runTests();
