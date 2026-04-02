const cacheService = require('../server/services/cacheService.js');

async function testThunderingHerd() {
    let callCount = 0;
    const fetcher = async () => {
        callCount++;
        console.log(`Fetcher called ${callCount} times`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow DB call
        return { data: 'some-value' };
    };

    console.log('Starting parallel requests...');
    const results = await Promise.all([
        cacheService.getOrSet('test-key', fetcher, 60, 'test-ns'),
        cacheService.getOrSet('test-key', fetcher, 60, 'test-ns'),
        cacheService.getOrSet('test-key', fetcher, 60, 'test-ns')
    ]);

    console.log('Results:', results.length);
    console.log('Final Call Count:', callCount);

    if (callCount > 1) {
        console.log('FAIL: Thundering herd detected!');
        process.exit(1);
    } else {
        console.log('SUCCESS: No thundering herd.');
        process.exit(0);
    }
}

testThunderingHerd();
