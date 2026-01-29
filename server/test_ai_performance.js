/**
 * AI Performance Test Script
 * Tests the effectiveness of caching and optimizations
 * 
 * Run: node server/test_ai_performance.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Test configuration
const TESTS = {
    systemContext: {
        name: 'System Context Cache Test',
        endpoint: '/ai/stats',
        iterations: 10
    },
    aiProcess: {
        name: 'AI Chat Processing Test',
        endpoint: '/ai/process',
        iterations: 5,
        payload: { message: 'Ayvalık\'ta 2+1 satılık daire var mı?' }
    }
};

// Helper to measure execution time
async function measureTime(fn) {
    const start = Date.now();
    await fn();
    return Date.now() - start;
}

// Test authentication
async function authenticate() {
    console.log('🔐 Authenticating...');
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@trio.com',
            password: 'admin123'
        });
        authToken = response.data.token;
        console.log('✅ Authenticated successfully\n');
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        console.log('💡 Make sure the server is running and credentials are correct');
        process.exit(1);
    }
}

// Test system context caching
async function testSystemContextCache() {
    console.log(`📊 Running: ${TESTS.systemContext.name}`);
    console.log(`   Iterations: ${TESTS.systemContext.iterations}\n`);

    const times = [];

    for (let i = 0; i < TESTS.systemContext.iterations; i++) {
        const time = await measureTime(async () => {
            await axios.get(`${API_BASE}${TESTS.systemContext.endpoint}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
        });
        times.push(time);

        const cacheStatus = i === 0 ? '(Cache MISS)' : '(Cache HIT expected)';
        console.log(`   Request ${i + 1}: ${time}ms ${cacheStatus}`);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const firstRequest = times[0];
    const avgCached = (times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1)).toFixed(2);
    const improvement = (((firstRequest - avgCached) / firstRequest) * 100).toFixed(2);

    console.log(`\n   📈 Results:`);
    console.log(`   - First request (uncached): ${firstRequest}ms`);
    console.log(`   - Average cached requests: ${avgCached}ms`);
    console.log(`   - Performance improvement: ${improvement}%`);
    console.log(`   - Overall average: ${avg}ms\n`);

    return { firstRequest, avgCached, improvement };
}

// Test AI chat processing
async function testAIChatProcessing() {
    console.log(`💬 Running: ${TESTS.aiProcess.name}`);
    console.log(`   Iterations: ${TESTS.aiProcess.iterations}\n`);

    const times = [];

    for (let i = 0; i < TESTS.aiProcess.iterations; i++) {
        const time = await measureTime(async () => {
            await axios.post(`${API_BASE}${TESTS.aiProcess.endpoint}`,
                TESTS.aiProcess.payload,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
        });
        times.push(time);
        console.log(`   Request ${i + 1}: ${time}ms`);

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`\n   📈 Results:`);
    console.log(`   - Average: ${avg}ms`);
    console.log(`   - Min: ${min}ms`);
    console.log(`   - Max: ${max}ms\n`);

    return { avg, min, max };
}

// Get cache statistics
async function getCacheStats() {
    try {
        const response = await axios.get(`${API_BASE}/ai/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to get cache stats:', error.message);
        return null;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 AI Performance Test Suite\n');
    console.log('='.repeat(50) + '\n');

    await authenticate();

    const results = {
        systemContext: await testSystemContextCache(),
        aiProcess: await testAIChatProcessing()
    };

    console.log('='.repeat(50));
    console.log('\n📊 FINAL RESULTS SUMMARY\n');
    console.log('System Context Cache:');
    console.log(`  • Cache effectiveness: ${results.systemContext.improvement}% faster`);
    console.log(`  • First request: ${results.systemContext.firstRequest}ms`);
    console.log(`  • Cached average: ${results.systemContext.avgCached}ms\n`);

    console.log('AI Chat Processing:');
    console.log(`  • Average response time: ${results.aiProcess.avg}ms`);
    console.log(`  • Range: ${results.aiProcess.min}ms - ${results.aiProcess.max}ms\n`);

    console.log('='.repeat(50));

    // Check if cache improvement is significant
    if (parseFloat(results.systemContext.improvement) > 40) {
        console.log('\n✅ Cache is working effectively! (>40% improvement)');
    } else if (parseFloat(results.systemContext.improvement) > 20) {
        console.log('\n⚠️  Cache is working but could be better (20-40% improvement)');
    } else {
        console.log('\n❌ Cache may not be working properly (<20% improvement)');
    }

    console.log('\n💡 Tip: Run this test multiple times to see consistent patterns\n');
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
});
