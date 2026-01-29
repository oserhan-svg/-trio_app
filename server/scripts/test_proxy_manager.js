/**
 * Proxy Manager Test Script
 * Tests proxy fetching, health checking, and rotation
 */

const { ProxyManager, initializeProxyManager } = require('../services/proxyManager');
const { getProxyStats, refreshAllProxies } = require('../services/proxyIntegration');
const scraperConfig = require('../config/scraperConfig');

async function testProxyFetching() {
    console.log('🧪 Testing Proxy Fetching\n');
    console.log('='.repeat(60));

    const manager = new ProxyManager({
        webshareApiKey: process.env.WEBSHARE_API_KEY,
        enableHealthCheck: false // Skip health check for faster testing
    });

    console.log('\n1. Testing ProxyScrape...');
    const proxyscrapeProxies = await manager.fetchProxyScrapeProxies();
    console.log(`   ✅ Fetched ${proxyscrapeProxies.length} proxies from ProxyScrape`);

    console.log('\n2. Testing Free-Proxy-List...');
    const freeProxies = await manager.fetchFreeProxyList();
    console.log(`   ✅ Fetched ${freeProxies.length} proxies from Free-Proxy-List`);

    if (process.env.WEBSHARE_API_KEY) {
        console.log('\n3. Testing WebShare.io...');
        const webshareProxies = await manager.fetchWebShareProxies();
        console.log(`   ✅ Fetched ${webshareProxies.length} proxies from WebShare.io`);
    } else {
        console.log('\n3. Skipping WebShare.io (no API key)');
        console.log('   ℹ️ Set WEBSHARE_API_KEY environment variable to test');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Proxy fetching tests completed!\n');
}

async function testProxyRotation() {
    console.log('🧪 Testing Proxy Rotation\n');
    console.log('='.repeat(60));

    const manager = new ProxyManager({
        enableHealthCheck: false
    });

    // Add some test proxies
    manager.proxies = [
        'http://proxy1.example.com:8080',
        'http://proxy2.example.com:8080',
        'http://proxy3.example.com:8080'
    ];

    console.log('\nRound-Robin Rotation:');
    for (let i = 0; i < 6; i++) {
        const proxy = manager.getNextProxy();
        console.log(`   ${i + 1}. ${proxy}`);
    }

    console.log('\nRandom Rotation:');
    for (let i = 0; i < 6; i++) {
        const proxy = manager.getRandomProxy();
        console.log(`   ${i + 1}. ${proxy}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Proxy rotation tests completed!\n');
}

async function testHealthReporting() {
    console.log('🧪 Testing Health Reporting\n');
    console.log('='.repeat(60));

    const manager = new ProxyManager({
        enableHealthCheck: false,
        minHealthScore: 0.5
    });

    const testProxy = 'http://test.proxy.com:8080';
    manager.proxies = [testProxy];

    console.log('\nSimulating proxy usage:');

    // Simulate 10 requests
    for (let i = 0; i < 10; i++) {
        const success = Math.random() > 0.3; // 70% success rate
        manager.reportProxyResult(testProxy, success);
        console.log(`   Request ${i + 1}: ${success ? '✅ Success' : '❌ Failure'}`);
    }

    const stats = manager.healthStats.get(testProxy);
    const total = stats.success + stats.failure;
    const healthScore = stats.success / total;

    console.log(`\n📊 Final Stats:`);
    console.log(`   Success: ${stats.success}/${total} (${(healthScore * 100).toFixed(1)}%)`);
    console.log(`   Health Score: ${healthScore >= manager.minHealthScore ? '✅ Healthy' : '❌ Unhealthy'}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Health reporting tests completed!\n');
}

async function testRealProxyHealthCheck() {
    console.log('🧪 Testing Real Proxy Health Check (5 proxies)\n');
    console.log('='.repeat(60));

    const manager = new ProxyManager({
        enableHealthCheck: true
    });

    // Fetch a small batch from ProxyScrape
    console.log('\n📥 Fetching test proxies from ProxyScrape...');
    const proxies = await manager.fetchProxyScrapeProxies();
    manager.proxies = proxies.slice(0, 5); // Test only 5 proxies

    console.log(`✅ Fetched ${manager.proxies.length} test proxies\n`);

    // Perform health check
    await manager.performHealthCheck(3); // 3 concurrent tests

    const stats = manager.getStats();
    console.log(`\n📊 Final Results:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Healthy: ${stats.healthy}`);
    console.log(`   Unhealthy: ${stats.unhealthy}`);
    console.log(`   Overall Health: ${(stats.healthScore * 100).toFixed(1)}%`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Real proxy health check completed!\n');
}

async function testProxyIntegration() {
    console.log('🧪 Testing Proxy Integration with Config\n');
    console.log('='.repeat(60));

    const config = scraperConfig.stealth.proxyManager;

    console.log('\nCurrent Configuration:');
    console.log(`   Enabled: ${config.enabled}`);
    console.log(`   WebShare API Key: ${config.webshareApiKey ? '✅ Set' : '❌ Not set'}`);
    console.log(`   ProxyScrape: ${config.enableProxyScrape ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Free-Proxy-List: ${config.enableFreeProxyList ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Min Health Score: ${config.minHealthScore}`);
    console.log(`   Rotation Strategy: ${config.rotationStrategy}`);

    if (!config.enabled) {
        console.log('\n⚠️ Proxy manager is disabled in config.');
        console.log('ℹ️ Set scraperConfig.stealth.proxyManager.enabled = true to activate');
    } else {
        console.log('\n✅ Proxy manager is enabled!');

        try {
            const stats = await refreshAllProxies();
            console.log(`\n📊 Proxy Stats:`);
            console.log(`   Total: ${stats.total}`);
            console.log(`   Healthy: ${stats.healthy}`);
            console.log(`   Unhealthy: ${stats.unhealthy}`);
        } catch (error) {
            console.error(`❌ Error refreshing proxies: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Proxy integration test completed!\n');
}

async function runProxyTests() {
    console.log('\n🚀 Proxy Manager Test Suite\n');
    console.log('='.repeat(60));
    console.log('\nThis will test:\n');
    console.log('1. Proxy fetching from multiple sources');
    console.log('2. Proxy rotation strategies');
    console.log('3. Health reporting system');
    console.log('4. Configuration integration\n');
    console.log('='.repeat(60) + '\n');

    try {
        await testProxyFetching();
        await testProxyRotation();
        await testHealthReporting();
        await testProxyIntegration();

        // Uncomment to test real proxy health check (slower)
        // await testRealProxyHealthCheck();

        console.log('='.repeat(60));
        console.log('✅ All proxy tests completed successfully!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
    }

    process.exit(0);
}

// Export test functions
module.exports = {
    testProxyFetching,
    testProxyRotation,
    testHealthReporting,
    testRealProxyHealthCheck,
    testProxyIntegration,
    runProxyTests
};

// Run if executed directly
if (require.main === module) {
    runProxyTests();
}
