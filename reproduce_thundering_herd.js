const CacheService = require('./server/services/cacheService');

async function testThunderingHerd() {
    console.log('--- Testing Current CacheService.getOrSet (Thundering Herd) ---');

    let fetchCount = 0;
    const fetcher = async () => {
        fetchCount++;
        console.log(`Fetcher called (${fetchCount})`);
        // Simulate network/DB delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return `Value ${fetchCount}`;
    };

    const key = 'test_key';

    // Simulate 5 concurrent requests
    console.log('Sending 5 concurrent requests...');
    const results = await Promise.all([
        CacheService.getOrSet(key, fetcher),
        CacheService.getOrSet(key, fetcher),
        CacheService.getOrSet(key, fetcher),
        CacheService.getOrSet(key, fetcher),
        CacheService.getOrSet(key, fetcher)
    ]);

    console.log('Results:', results);
    console.log('Total fetcher calls:', fetchCount);

    if (fetchCount > 1) {
        console.log('❌ Thundering herd detected: fetcher called multiple times for the same key.');
    } else {
        console.log('✅ Thundering herd prevented: fetcher called only once.');
    }
}

testThunderingHerd();
