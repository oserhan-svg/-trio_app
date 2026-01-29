/**
 * Enhanced Scraper Utilities
 * Helper functions to use enhanced fingerprinting and temporal delays
 */

const { createAdvancedStealthBrowser, configureAdvancedStealthPage } = require('./advancedBrowserFactory');
const { getHumanLikeDelay, getPageTransitionDelay, getReadingDelay, shouldTakeBreak, getBreakDuration } = require('./temporalDelays');
const { navigateWithCloudflareBypass, scrapeWithCloudflareHandling } = require('./cloudflareBypass');
const { getSessionManager } = require('./sessionManager');

/**
 * Get or create enhanced browser with session management
 */
async function getEnhancedBrowser(forceNew = false) {
    const sessionManager = getSessionManager();

    // Check if we should rotate session
    if (sessionManager.shouldRotateSession() || forceNew) {
        console.log('🔄 Rotating browser session for fresh fingerprint...');
        await sessionManager.rotateSession();
    }

    // Get existing browser or create new one
    let { browser, page } = sessionManager.getBrowser();

    if (!browser || !page) {
        console.log('🚀 Launching new enhanced browser session...');
        browser = await createAdvancedStealthBrowser();

        const pages = await browser.pages();
        page = pages[0] || await browser.newPage();

        await configureAdvancedStealthPage(page);

        // Add enhanced human behavior
        await addEnhancedHumanBehavior(page);

        sessionManager.setBrowser(browser, page);
    }

    return { browser, page, sessionManager };
}

/**
 * Add enhanced human behavior with temporal delays
 */
async function addEnhancedHumanBehavior(page) {
    // Override randomWait to use temporal delays
    page.randomWait = async (min, max) => {
        if (min && max) {
            // Use provided range
            const delay = Math.floor(Math.random() * (max - min + 1)) + min;
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            // Use intelligent temporal delay
            const delay = getHumanLikeDelay();
            console.log(`⏳ Temporal delay: ${Math.floor(delay / 1000)}s (Based on time of day)`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };

    // Enhanced page transition
    page.waitForPageTransition = async () => {
        const delay = getPageTransitionDelay();
        console.log(`⏳ Page transition delay: ${Math.floor(delay / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
    };

    // Reading simulation
    page.simulateReading = async (contentLength = 'medium') => {
        const delay = getReadingDelay(contentLength);
        console.log(`📖 Simulating reading (${contentLength}): ${Math.floor(delay / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
    };

    // Existing random scroll (keep as is)
    page.randomScroll = async () => {
        await page.evaluate(async () => {
            const distance = Math.floor(Math.random() * 400) + 100;
            window.scrollBy(0, distance);
            await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
            if (Math.random() > 0.7) {
                window.scrollBy(0, -Math.floor(distance / 3));
            }
        });
    };
}

/**
 * Smart scrape wrapper with session management and breaks
 */
async function smartScrape(scrapeFn, ...args) {
    const { browser, page, sessionManager } = await getEnhancedBrowser();

    try {
        // Execute the scrape function
        const result = await scrapeFn(page, ...args);

        // Track success
        sessionManager.trackRequest(true);

        // Check if we should take a break
        const stats = sessionManager.getStats();
        if (shouldTakeBreak(stats.requestCount, stats.duration)) {
            const breakDuration = getBreakDuration();
            console.log(`☕ Taking a break for ${Math.floor(breakDuration / 60000)} minutes...`);
            await new Promise(resolve => setTimeout(resolve, breakDuration));
        }

        return result;

    } catch (error) {
        // Track failure
        sessionManager.trackRequest(false);
        throw error;
    }
}

/**
 * Get adaptive delay based on current session performance
 */
function getAdaptiveDelay(baseDelay) {
    const sessionManager = getSessionManager();
    const stats = sessionManager.getStats();

    if (stats.requestCount < 5) {
        // Not enough data yet, use base delay
        return baseDelay;
    }

    // Adjust based on success rate
    if (stats.successRate < 0.5) {
        // Low success: increase delay by 2-3x
        const multiplier = 2 + Math.random();
        console.log(`⚠️ Low success rate (${(stats.successRate * 100).toFixed(1)}%), increasing delays by ${multiplier.toFixed(1)}x`);
        return baseDelay * multiplier;
    } else if (stats.successRate < 0.7) {
        // Medium success: increase delay by 1.5-2x
        const multiplier = 1.5 + Math.random() * 0.5;
        return baseDelay * multiplier;
    } else {
        // High success: use normal delay with variation
        return baseDelay * (0.8 + Math.random() * 0.4);
    }
}

module.exports = {
    getEnhancedBrowser,
    addEnhancedHumanBehavior,
    smartScrape,
    getAdaptiveDelay
};
