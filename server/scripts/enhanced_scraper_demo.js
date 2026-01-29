/**
 * Real-World Integration Example
 * Shows how to integrate all enhancements into your existing scraper
 */

const { getFullyEnhancedBrowser } = require('../services/proxyIntegration');
const { getSessionManager } = require('../services/sessionManager');
const { isOptimalScrapingTime } = require('../services/temporalDelays');
const scraperConfig = require('../config/scraperConfig');

/**
 * Enhanced version of scrapeHepsiemlak with all Phase 1 + 2 features
 */
async function scrapeHepsiemlakEnhanced(url, forcedSellerType = null, category = 'residential', targetPages = [1, 2, 3]) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 ENHANCED SCRAPER: ${url}`);
    console.log(`${'='.repeat(70)}\n`);

    // Check optimal time
    if (!isOptimalScrapingTime()) {
        console.log('⏰ Note: Current time is outside optimal scraping hours (9-20)');
        console.log('   Continuing anyway, but delays will be longer...\n');
    }

    // Get fully enhanced browser (fingerprinting + proxy + session management)
    const { browser, page, sessionManager } = await getFullyEnhancedBrowser();

    console.log(`📊 Session Info:`);
    console.log(`   - Browser: Enhanced with 13 fingerprinting techniques`);
    console.log(`   - Proxy: ${scraperConfig.stealth.proxyManager.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   - Session: ${sessionManager.requestCount} requests so far\n`);

    const allListings = [];

    try {
        for (const pageNum of targetPages) {
            const pageUrl = `${url}?page=${pageNum}`;
            console.log(`\n📄 Page ${pageNum}/${targetPages.length}: ${pageUrl}`);

            try {
                // Navigate with organic behavior
                console.log('   🌐 Navigating...');
                await page.goto(pageUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: scraperConfig.timeouts.pageLoad
                });

                // Simulate reading the page
                console.log('   📖 Simulating reading...');
                await page.simulateReading('short');

                // Random scroll
                await page.randomScroll();

                // Extract listings (simplified example)
                const listings = await page.evaluate((forcedType, cat) => {
                    const items = document.querySelectorAll('.listing-item, .list-item');
                    const data = [];

                    items.forEach(item => {
                        const id = item.id || `listing-${Math.random()}`;
                        const titleEl = item.querySelector('.list-view-title, h3');
                        const priceEl = item.querySelector('.list-view-price, .price');

                        if (titleEl && priceEl) {
                            data.push({
                                external_id: id,
                                title: titleEl.innerText.trim(),
                                price: parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) || 0,
                                category: cat,
                                seller_type: forcedType || 'office'
                            });
                        }
                    });

                    return data;
                }, forcedSellerType, category);

                console.log(`   ✅ Extracted: ${listings.length} listings`);
                allListings.push(...listings);

                // Track success
                sessionManager.trackRequest(true);

                // Adaptive delay before next page
                if (pageNum < targetPages[targetPages.length - 1]) {
                    console.log('   ⏳ Waiting before next page...');
                    await page.waitForPageTransition();
                }

            } catch (error) {
                console.error(`   ❌ Error on page ${pageNum}: ${error.message}`);
                sessionManager.trackRequest(false);
            }
        }

        // Session stats
        const stats = sessionManager.getStats();
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📊 SESSION STATISTICS:`);
        console.log(`   Total Requests: ${stats.requestCount}`);
        console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`   Duration: ${stats.durationMinutes} minutes`);
        console.log(`   Total Listings: ${allListings.length}`);
        console.log(`${'='.repeat(70)}\n`);

        return allListings;

    } catch (error) {
        console.error('❌ Scraper failed:', error);
        throw error;
    }
}

/**
 * Enhanced version of scrapeSahibinden
 */
async function scrapeSahibindenEnhanced(url, forcedSellerType = null, category = 'residential', targetPages = [1, 2]) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 ENHANCED SCRAPER: ${url}`);
    console.log(`${'='.repeat(70)}\n`);

    const { browser, page, sessionManager } = await getFullyEnhancedBrowser();

    console.log(`📊 Session Info:`);
    console.log(`   - Enhanced Fingerprinting: ✅`);
    console.log(`   - Proxy Rotation: ${scraperConfig.stealth.proxyManager.enabled ? '✅' : '❌'}`);
    console.log(`   - Temporal Delays: ✅\n`);

    const allListings = [];

    try {
        for (const pageNum of targetPages) {
            const offset = (pageNum - 1) * 20;
            const pageUrl = url.includes('?')
                ? `${url}&pagingOffset=${offset}`
                : `${url}?pagingOffset=${offset}`;

            console.log(`\n📄 Page ${pageNum}/${targetPages.length}: ${pageUrl}`);

            try {
                console.log('   🌐 Navigating...');
                await page.goto(pageUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: scraperConfig.timeouts.pageLoad
                });

                console.log('   📖 Reading page...');
                await page.simulateReading('medium');
                await page.randomScroll();

                // Extract listings
                const listings = await page.evaluate((forcedType) => {
                    const rows = document.querySelectorAll('.searchResultsItem');
                    const data = [];

                    rows.forEach(row => {
                        const id = row.getAttribute('data-id');
                        if (!id) return;

                        const urlEl = row.querySelector('a.classifiedTitle');
                        const priceEl = row.querySelector('.searchResultsPriceValue');

                        if (urlEl && priceEl) {
                            data.push({
                                external_id: id,
                                title: urlEl.innerText.trim(),
                                price: parseFloat(priceEl.innerText.replace(/[^0-9]/g, '')) || 0,
                                url: 'https://www.sahibinden.com' + urlEl.getAttribute('href'),
                                seller_type: forcedType || 'office'
                            });
                        }
                    });

                    return data;
                }, forcedSellerType);

                console.log(`   ✅ Extracted: ${listings.length} listings`);
                allListings.push(...listings);

                sessionManager.trackRequest(true);

                if (pageNum < targetPages[targetPages.length - 1]) {
                    console.log('   ⏳ Waiting...');
                    await page.waitForPageTransition();
                }

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                sessionManager.trackRequest(false);
            }
        }

        const stats = sessionManager.getStats();
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📊 RESULTS:`);
        console.log(`   Success: ${stats.successCount}/${stats.requestCount}`);
        console.log(`   Listings: ${allListings.length}`);
        console.log(`${'='.repeat(70)}\n`);

        return allListings;

    } catch (error) {
        console.error('❌ Scraper failed:', error);
        throw error;
    }
}

/**
 * Demo: Run enhanced scraper
 */
async function runDemo() {
    console.log('\n🎯 ENHANCED WEB SCRAPER DEMO\n');
    console.log('This demonstrates the complete Phase 1 + 2 implementation:');
    console.log('  ✅ 13 Advanced fingerprinting techniques');
    console.log('  ✅ Temporal delay patterns (time-aware)');
    console.log('  ✅ Automatic session rotation');
    console.log('  ✅ Proxy rotation (if enabled)');
    console.log('  ✅ Health monitoring\n');

    try {
        // Example 1: Scrape Hepsiemlak
        console.log('📍 Example 1: Hepsiemlak Scraping\n');
        const hepsiemlakListings = await scrapeHepsiemlakEnhanced(
            'https://www.hepsiemlak.com/ayvalik-satilik/daire',
            null,
            'daire',
            [1, 2] // Just 2 pages for demo
        );

        console.log(`✅ Hepsiemlak Complete: ${hepsiemlakListings.length} listings\n`);

        // Optional: Example 2 - Sahibinden
        // Uncomment to test Sahibinden as well
        /*
        console.log('📍 Example 2: Sahibinden Scraping\n');
        const sahibindenListings = await scrapeSahibindenEnhanced(
            'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik',
            null,
            'daire',
            [1, 2]
        );
        console.log(`✅ Sahibinden Complete: ${sahibindenListings.length} listings\n`);
        */

        console.log('\n✨ DEMO COMPLETED SUCCESSFULLY! ✨\n');

    } catch (error) {
        console.error('\n❌ Demo failed:', error);
    }

    process.exit(0);
}

// Export functions
module.exports = {
    scrapeHepsiemlakEnhanced,
    scrapeSahibindenEnhanced,
    runDemo
};

// Run demo if executed directly
if (require.main === module) {
    runDemo();
}
