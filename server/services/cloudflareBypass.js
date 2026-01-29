/**
 * Cloudflare Bypass Utilities
 * Automatic detection and bypass for Cloudflare Turnstile challenges
 */

/**
 * Detect if page is showing Cloudflare challenge
 */
async function detectCloudflareChallenge(page) {
    try {
        const indicators = await page.evaluate(() => {
            // Check for Cloudflare challenge indicators
            const bodyText = document.body.innerText || '';
            const title = document.title || '';

            return {
                hasCloudflareTurnstile: bodyText.includes('challenges.cloudflare.com') ||
                    bodyText.includes('Checking your browser') ||
                    bodyText.includes('Just a moment') ||
                    bodyText.includes('Bir dakika lütfen'),
                hasChallengeFrame: !!document.querySelector('iframe[src*="challenges.cloudflare"]'),
                title: title,
                bodySnippet: bodyText.substring(0, 200)
            };
        });

        return indicators.hasCloudflareTurnstile || indicators.hasChallengeFrame;
    } catch (e) {
        return false;
    }
}

/**
 * Wait for Cloudflare challenge to be solved
 * This gives puppeteer-real-browser's automatic solver time to work
 */
async function waitForCloudflareSolve(page, maxWaitTime = 45000) {
    console.log('🛡️ Cloudflare Challenge detected - waiting for auto-solve...');

    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < maxWaitTime) {
        attempts++;

        // Check if challenge is still present
        const stillChallenged = await detectCloudflareChallenge(page);

        if (!stillChallenged) {
            console.log(`✅ Cloudflare Challenge passed! (${attempts} checks, ${Math.floor((Date.now() - startTime) / 1000)}s)`);

            // Extra wait for page to stabilize
            await page.waitForTimeout(2000);
            return true;
        }

        // Log progress every 5 seconds
        if (attempts % 5 === 0) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`   ⏳ Still solving... (${elapsed}s / ${maxWaitTime / 1000}s)`);
        }

        // Wait before next check
        await page.waitForTimeout(1000);
    }

    console.log(`⚠️ Cloudflare Challenge timeout after ${maxWaitTime / 1000}s`);
    return false;
}

/**
 * Handle Cloudflare challenge with multiple strategies
 */
async function handleCloudflareChallenge(page, options = {}) {
    const {
        maxAutoWait = 45000,        // 45 seconds for auto-solve
        enableManualFallback = true, // Allow manual intervention
        retryOnFail = true
    } = options;

    // Strategy 1: Automatic bypass (puppeteer-real-browser)
    console.log('🤖 Strategy 1: Automatic bypass (puppeteer-real-browser solver)');
    const autoSolved = await waitForCloudflareSolve(page, maxAutoWait);

    if (autoSolved) {
        return { success: true, method: 'automatic' };
    }

    // Strategy 2: Manual intervention fallback
    if (enableManualFallback) {
        console.log('👆 Strategy 2: Manual intervention mode');
        console.log('');
        console.log('='.repeat(70));
        console.log('⚠️  CLOUDFLARE CHALLENGE REQUIRES MANUAL INTERVENTION');
        console.log('='.repeat(70));
        console.log('');
        console.log('Please manually solve the challenge in the browser:');
        console.log('  1. Look for the Cloudflare checkbox or challenge');
        console.log('  2. Click it if needed');
        console.log('  3. Wait for the page to load normally');
        console.log('');
        console.log('Waiting up to 2 minutes for manual solve...');
        console.log('');

        // Wait up to 2 minutes for manual solve
        const manuallySolved = await waitForCloudflareSolve(page, 120000);

        if (manuallySolved) {
            console.log('✅ Manual solve successful!');
            return { success: true, method: 'manual' };
        }
    }

    // Strategy 3: Retry with fresh session
    if (retryOnFail) {
        console.log('🔄 Strategy 3: Will retry with fresh browser session');
        return { success: false, method: 'retry', shouldRetry: true };
    }

    return { success: false, method: 'none', shouldRetry: false };
}

/**
 * Smart navigation with Cloudflare detection
 */
async function navigateWithCloudflareBypass(page, url, options = {}) {
    console.log(`🌐 Navigating to: ${url}`);

    try {
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
            ...options.gotoOptions
        });

        // Wait a bit for page to settle
        await page.waitForTimeout(2000);

        // Check for Cloudflare challenge
        const hasChallenge = await detectCloudflareChallenge(page);

        if (hasChallenge) {
            console.log('🛡️ Cloudflare Challenge detected on navigation');
            const result = await handleCloudflareChallenge(page, options.challengeOptions);

            if (!result.success && result.shouldRetry) {
                console.log('🔄 Retrying navigation after Cloudflare fail');
                return { success: false, retry: true, challenge: true };
            }

            return { success: result.success, challenge: true, method: result.method };
        }

        return { success: true, challenge: false };

    } catch (error) {
        console.error(`❌ Navigation error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Wrapper for scraping functions with Cloudflare handling
 */
async function scrapeWithCloudflareHandling(scrapeFn, page, ...args) {
    try {
        const result = await scrapeFn(page, ...args);
        return result;
    } catch (error) {
        // Check if error is related to Cloudflare
        const hasChallenge = await detectCloudflareChallenge(page);

        if (hasChallenge) {
            console.log('🛡️ Cloudflare Challenge detected during scraping');
            const bypassResult = await handleCloudflareChallenge(page);

            if (bypassResult.success) {
                console.log('✅ Cloudflare bypassed, retrying scrape...');
                return await scrapeFn(page, ...args);
            } else {
                throw new Error('Cloudflare Challenge could not be bypassed');
            }
        }

        throw error;
    }
}

module.exports = {
    detectCloudflareChallenge,
    waitForCloudflareSolve,
    handleCloudflareChallenge,
    navigateWithCloudflareBypass,
    scrapeWithCloudflareHandling
};
