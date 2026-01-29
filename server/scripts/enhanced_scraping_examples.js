/**
 * Integration Example: How to use Enhanced Scraping Modules
 * 
 * This script demonstrates how to integrate the new enhanced scraping modules
 * into your existing scraper workflow.
 */

const { getEnhancedBrowser, getAdaptiveDelay } = require('../services/enhancedScraperUtils');
const { getSessionManager } = require('../services/sessionManager');
const { isOptimalScrapingTime, getNextOptimalWindow } = require('../services/temporalDelays');

/**
 * EXAMPLE 1: Basic Enhanced Scraping
 */
async function basicEnhancedScraping() {
    console.log('=== Example 1: Basic Enhanced Scraping ===\n');

    // Get enhanced browser with automatic fingerprinting
    const { browser, page, sessionManager } = await getEnhancedBrowser();

    try {
        // Navigate to target
        await page.goto('https://www.hepsiemlak.com', { waitUntil: 'domcontentloaded' });

        // Use enhanced human behavior
        await page.simulateReading('short'); // Simulate reading page content
        await page.randomScroll(); // Random scrolling

        // Continue with your scraping logic...

        // Track success
        sessionManager.trackRequest(true);

    } catch (error) {
        sessionManager.trackRequest(false);
        console.error('Scraping failed:', error.message);
    }

    // Get session stats
    const stats = sessionManager.getStats();
    console.log(`\n📊 Session Stats: ${stats.requestCount} requests, ${(stats.successRate * 100).toFixed(1)}% success\n`);
}

/**
 * EXAMPLE 2: Using Enhanced Scraper in Existing Code (DROP-IN REPLACEMENT)
 */
async function dropInReplacement() {
    console.log('=== Example 2: Drop-in Replacement for Existing Code ===\n');

    // BEFORE (your current code):
    // const { launchRealBrowser } = require('./realBrowser');
    // const { browser, page } = await launchRealBrowser();

    // AFTER (enhanced version - just change this one line):
    const { browser, page, sessionManager } = await getEnhancedBrowser();

    // Rest of your code stays the same!
    // The browser/page now have:
    // - Enhanced fingerprinting (audio, fonts, battery, WebRTC)
    // - Temporal delays (await page.randomWait())
    // - Automatic session rotation

    await page.goto('https://www.sahibinden.com', { waitUntil: 'domcontentloaded' });
    await page.randomWait(); // Uses temporal delays automatically

    sessionManager.trackRequest(true);
}

/**
 * EXAMPLE 3: Loop with Automatic Session Rotation  
 */
async function loopWithRotation() {
    console.log('=== Example 3: Loop with Automatic Session Rotation ===\n');

    const categories = ['daire', 'villa', 'arsa', 'isyeri'];

    for (const category of categories) {
        // Get browser - will auto-rotate if needed
        const { browser, page, sessionManager } = await getEnhancedBrowser();

        console.log(`\n📂 Scraping category: ${category}`);

        try {
            await page.goto(`https://www.hepsiemlak.com/${category}`, { waitUntil: 'domcontentloaded' });

            // Simulate reading
            await page.simulateReading('medium');

            // Check if we should rotate
            if (sessionManager.shouldRotateSession()) {
                console.log('🔄 Session will rotate before next category');
            }

            sessionManager.trackRequest(true);

        } catch (error) {
            sessionManager.trackRequest(false);
            console.error(`Error scraping ${category}:`, error.message);
        }

        // Adaptive delay between categories
        const baseDelay = 5000;
        const adaptiveDelay = getAdaptiveDelay(baseDelay);
        console.log(`⏳ Waiting ${Math.floor(adaptiveDelay / 1000)}s before next category...`);
        await new Promise(r => setTimeout(r, adaptiveDelay));
    }

    const stats = getSessionManager().getStats();
    console.log(`\n✅ Completed! Total: ${stats.requestCount} requests, ${(stats.successRate * 100).toFixed(1)}% success\n`);
}

/**
 * EXAMPLE 4: Check Optimal Scraping Time
 */
async function checkOptimalTime() {
    console.log('=== Example 4: Optimal Scraping Time Check ===\n');

    if (!isOptimalScrapingTime()) {
        const nextWindow = getNextOptimalWindow();
        const waitTime = nextWindow - new Date();
        const waitHours = Math.floor(waitTime / (1000 * 60 * 60));

        console.log(`⏰ Current time is not optimal for scraping.`);
        console.log(`⏰ Next optimal window: ${nextWindow.toLocaleString('tr-TR')}`);
        console.log(`⏰ Wait time: ${waitHours} hours\n`);

        // Option: Schedule for later or continue anyway
        return;
    }

    console.log('✅ Current time is optimal for scraping!\n');
    // Continue with scraping...
}

/**
 * EXAMPLE 5: Using in scrapeHepsiemlak Function
 * This shows how to integrate into your existing scrapeHepsiemlak function
 */
async function enhancedScrapeHepsiemlak(url, forcedSellerType = null, category = 'residential', targetPages = [1, 2]) {
    console.log('=== Example 5: Enhanced scrapeHepsiemlak ===\n');

    // Get enhanced browser instead of regular one
    const { browser, page, sessionManager } = await getEnhancedBrowser();

    console.log(`Scraping: ${url}`);

    for (const pageNum of targetPages) {
        const pageUrl = `${url}?page=${pageNum}`;

        try {
            await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

            // Use enhanced behaviors
            await page.simulateReading('short'); // Simulate looking at listings
            await page.randomScroll();

            // Your existing extraction logic here...
            const listings = await page.evaluate(() => {
                // ... your existing code ...
                return []; // placeholder
            });

            console.log(`✅ Page ${pageNum}: Found ${listings.length} listings`);
            sessionManager.trackRequest(true);

            // Adaptive delay between pages
            if (pageNum < targetPages[targetPages.length - 1]) {
                await page.waitForPageTransition(); // Intelligent delay
            }

        } catch (error) {
            console.error(`❌ Page ${pageNum} failed:`, error.message);
            sessionManager.trackRequest(false);
        }
    }

    // Log stats
    const stats = sessionManager.getStats();
    console.log(`\n📊 Scrape completed: ${stats.requestCount} pages, ${(stats.successRate * 100).toFixed(1)}% success\n`);
}

/**
 * EXAMPLE 6: Force Session Rotation
 */
async function forceRotationExample() {
    console.log('=== Example 6: Force Session Rotation ===\n');

    // Sometimes you want to force a fresh session (e.g., after being blocked)
    const { browser, page, sessionManager } = await getEnhancedBrowser(true); // force new session

    console.log('✨ Fresh browser session with new fingerprint created!\n');

    // Continue scraping with clean slate...
}

// Export examples
module.exports = {
    basicEnhancedScraping,
    dropInReplacement,
    loopWithRotation,
    checkOptimalTime,
    enhancedScrapeHepsiemlak,
    forceRotationExample
};

// Run examples if executed directly
if (require.main === module) {
    (async () => {
        console.log('🚀 Enhanced Scraping Integration Examples\n');
        console.log('='.repeat(50) + '\n');

        // Uncomment to run specific examples:
        // await basicEnhancedScraping();
        // await dropInReplacement();
        // await loopWithRotation();
        await checkOptimalTime();
        // await enhancedScrapeHepsiemlak('https://www.hepsiemlak.com/ayvalik-satilik/daire');
        // await forceRotationExample();

        console.log('='.repeat(50));
        console.log('\n✅ Examples completed! See code comments for integration details.');

        process.exit(0);
    })();
}
