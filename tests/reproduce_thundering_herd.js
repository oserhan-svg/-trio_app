const CacheService = require('../server/services/cacheService');

async function test() {
    let callCount = 0;
    const fetcher = async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow fetch
        return 'data';
    };

    console.log('Starting parallel requests...');
    const results = await Promise.all([
        CacheService.getOrSet('test-key', fetcher, 60),
        CacheService.getOrSet('test-key', fetcher, 60),
        CacheService.getOrSet('test-key', fetcher, 60)
    ]);

    console.log('Results:', results);
    console.log('Fetcher call count:', callCount);

    if (callCount > 1) {
        console.log('❌ VULNERABLE to thundering herd: fetcher called multiple times.');
    } else {
        console.log('✅ PROTECTED from thundering herd: fetcher called only once.');
    }
}

test();
