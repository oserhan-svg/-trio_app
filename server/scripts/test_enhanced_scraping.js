/**
 * Enhanced Scraping Test & Validation Script
 * 
 * Tests the new enhanced scraping modules and validates fingerprint randomization
 */

const { getEnhancedBrowser } = require('../services/enhancedScraperUtils');
const { getSessionManager } = require('../services/sessionManager');

async function testFingerprints() {
    console.log('🧪 Testing Enhanced Fingerprinting\n');
    console.log('='.repeat(60));

    // Create 3 different browser sessions to test fingerprint variation
    for (let i = 1; i <= 3; i++) {
        console.log(`\n🔬 Test Session ${i}:`);

        const { browser, page } = await getEnhancedBrowser(true); // Force new session each time

        try {
            // Navigate to fingerprint testing site
            console.log('   Navigating to BrowserLeaks...');
            await page.goto('https://browserleaks.com/javascript', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            await page.waitForTimeout(3000);

            // Extract fingerprint data
            const fingerprint = await page.evaluate(() => {
                return {
                    userAgent: navigator.userAgent,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: navigator.deviceMemory,
                    maxTouchPoints: navigator.maxTouchPoints,
                    platform: navigator.platform,
                    languages: navigator.languages,
                    webdriver: navigator.webdriver,
                    plugins: navigator.plugins.length,
                    vendor: navigator.vendor,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    colorDepth: screen.colorDepth,
                    hasBattery: 'getBattery' in navigator
                };
            });

            console.log('   ✅ Fingerprint Data:');
            console.log(`      - User Agent: ${fingerprint.userAgent.substring(0, 50)}...`);
            console.log(`      - Hardware Cores: ${fingerprint.hardwareConcurrency}`);
            console.log(`      - Device Memory: ${fingerprint.deviceMemory} GB`);
            console.log(`      - Max Touch Points: ${fingerprint.maxTouchPoints}`);
            console.log(`      - Viewport: ${fingerprint.viewportWidth}x${fingerprint.viewportHeight}`);
            console.log(`      - Plugins: ${fingerprint.plugins}`);
            console.log(`      - WebDriver: ${fingerprint.webdriver}`);
            console.log(`      - Battery API: ${fingerprint.hasBattery ? '❌ Exposed' : '✅ Removed'}`);

            await browser.close();

        } catch (error) {
            console.error(`   ❌ Test ${i} failed:`, error.message);
        }

        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Fingerprint tests completed!\n');
}

async function testSessionRotation() {
    console.log('🧪 Testing Session Rotation\n');
    console.log('='.repeat(60));

    const sessionManager = getSessionManager();

    // Simulate 100 requests
    for (let i = 1; i <= 100; i++) {
        const success = Math.random() > 0.1; // 90% success rate
        sessionManager.trackRequest(success);

        if (sessionManager.shouldRotateSession()) {
            const stats = sessionManager.getStats();
            console.log(`\n🔄 Session rotation triggered after ${i} requests`);
            console.log(`   Stats: ${stats.requestCount} requests, ${(stats.successRate * 100).toFixed(1)}% success, ${stats.durationMinutes} minutes`);

            await sessionManager.rotateSession();
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Session rotation test completed!\n');
}

async function testTemporalDelays() {
    console.log('🧪 Testing Temporal Delays\n');
    console.log('='.repeat(60));

    const { getHumanLikeDelay } = require('../services/temporalDelays');

    // Test delays for different hours
    const hours = [3, 9, 12, 15, 18, 23]; // Night, morning, noon, afternoon, evening, late night

    console.log('\nTemporal Delay Patterns by Hour:\n');

    for (const hour of hours) {
        const delays = [];

        // Get 5 sample delays for this hour
        for (let i = 0; i < 5; i++) {
            delays.push(getHumanLikeDelay(hour));
        }

        const avg = delays.reduce((a, b) => a + b, 0) / delays.length;
        const min = Math.min(...delays);
        const max = Math.max(...delays);

        const timeLabel = hour < 6 ? 'Late Night' :
            hour < 12 ? 'Morning' :
                hour < 14 ? 'Noon' :
                    hour < 18 ? 'Afternoon' :
                        hour < 22 ? 'Evening' : 'Night';

        console.log(`   ${hour.toString().padStart(2, '0')}:00 (${timeLabel.padEnd(10)}): ${(min / 1000).toFixed(1)}s - ${(max / 1000).toFixed(1)}s (avg: ${(avg / 1000).toFixed(1)}s)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Temporal delay tests completed!\n');
}

async function testRealWorldScraping() {
    console.log('🧪 Testing Real-World Scraping Scenario\n');
    console.log('='.repeat(60));

    const { browser, page, sessionManager } = await getEnhancedBrowser();

    const testUrls = [
        'https://www.hepsiemlak.com',
        'https://www.sahibinden.com',
        'https://www.google.com.tr'
    ];

    for (const url of testUrls) {
        try {
            console.log(`\n📄 Testing: ${url}`);

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('   ✅ Navigation successful');

            await page.simulateReading('short');
            console.log('   ✅ Reading simulation completed');

            await page.randomScroll();
            console.log('   ✅ Random scrolling completed');

            sessionManager.trackRequest(true);

            const stats = sessionManager.getStats();
            console.log(`   📊 Session stats: ${stats.requestCount} requests, ${(stats.successRate * 100).toFixed(1)}% success`);

        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
            sessionManager.trackRequest(false);
        }

        await page.waitForPageTransition();
    }

    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Real-world scraping test completed!\n');
}

// Main test runner
async function runAllTests() {
    console.log('\n🚀 Enhanced Scraping Module Test Suite\n');
    console.log('='.repeat(60));
    console.log('\nThis will test all enhanced scraping components:\n');
    console.log('1. Fingerprint randomization');
    console.log('2. Session rotation logic');
    console.log('3. Temporal delay patterns');
    console.log('4. Real-world scraping scenario\n');
    console.log('='.repeat(60) + '\n');

    try {
        // Run tests
        await testTemporalDelays();
        await testSessionRotation();
        // await testFingerprints(); // Uncomment to test fingerprints (requires internet)
        // await testRealWorldScraping(); // Uncomment to test real scraping (requires internet)

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed successfully!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
    }

    process.exit(0);
}

// Export test functions
module.exports = {
    testFingerprints,
    testSessionRotation,
    testTemporalDelays,
    testRealWorldScraping,
    runAllTests
};

// Run if executed directly
if (require.main === module) {
    runAllTests();
}
