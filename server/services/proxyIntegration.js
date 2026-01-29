/**
 * Proxy Integration Utilities
 * Helper functions to integrate proxy manager with enhanced browser
 */

const { getProxyManager, initializeProxyManager } = require('./proxyManager');
const { createAdvancedStealthBrowser } = require('./advancedBrowserFactory');
const scraperConfig = require('../config/scraperConfig');

/**
 * Get enhanced browser with proxy support
 */
async function getEnhancedBrowserWithProxy(options = {}) {
    const config = scraperConfig.stealth.proxyManager;

    // Check if proxy manager is enabled
    if (!config.enabled) {
        console.log('ℹ️ Proxy manager is disabled in config');
        return await createAdvancedStealthBrowser(options);
    }

    // Initialize proxy manager if not already
    const proxyManager = getProxyManager({
        webshareApiKey: config.webshareApiKey,
        minHealthScore: config.minHealthScore,
        healthCheckInterval: config.healthCheckInterval,
        enableHealthCheck: config.enableHealthCheck
    });

    // Refresh proxies if needed (first time or cache expired)
    if (proxyManager.proxies.length === 0) {
        console.log('🔄 Initializing proxy manager...');
        await proxyManager.refreshProxies();
    }

    // Get next proxy
    const proxy = config.rotationStrategy === 'random'
        ? proxyManager.getRandomProxy()
        : proxyManager.getNextProxy();

    if (!proxy) {
        console.log('⚠️ No proxies available, launching without proxy');
        return await createAdvancedStealthBrowser(options);
    }

    console.log(`🌐 Using proxy: ${proxy.substring(0, 30)}...`);

    // Launch browser with proxy
    return await createAdvancedStealthBrowser({
        ...options,
        proxy: proxy
    });
}

/**
 * Wrapper for scraping with proxy and reporting
 */
async function scrapeWithProxy(scrapeFn, ...args) {
    const config = scraperConfig.stealth.proxyManager;

    if (!config.enabled) {
        // No proxy, just execute
        return await scrapeFn(...args);
    }

    const proxyManager = getProxyManager();
    const proxy = config.rotationStrategy === 'random'
        ? proxyManager.getRandomProxy()
        : proxyManager.getNextProxy();

    if (!proxy) {
        console.log('⚠️ No proxy available for this request');
        return await scrapeFn(...args);
    }

    try {
        const result = await scrapeFn(proxy, ...args);

        // Report success
        proxyManager.reportProxyResult(proxy, true);

        return result;

    } catch (error) {
        // Report failure
        proxyManager.reportProxyResult(proxy, false);

        console.error(`❌ Scrape with proxy failed: ${error.message}`);
        throw error;
    }
}

/**
 * Get proxy statistics
 */
function getProxyStats() {
    const config = scraperConfig.stealth.proxyManager;

    if (!config.enabled) {
        return { enabled: false };
    }

    const proxyManager = getProxyManager();
    return {
        enabled: true,
        ...proxyManager.getStats()
    };
}

/**
 * Refresh all proxies (manual trigger)
 */
async function refreshAllProxies() {
    const config = scraperConfig.stealth.proxyManager;

    if (!config.enabled) {
        console.log('⚠️ Proxy manager is disabled');
        return;
    }

    const proxyManager = getProxyManager({
        webshareApiKey: config.webshareApiKey,
        minHealthScore: config.minHealthScore,
        healthCheckInterval: config.healthCheckInterval,
        enableHealthCheck: config.enableHealthCheck
    });

    await proxyManager.refreshProxies();

    return proxyManager.getStats();
}

/**
 * Enhanced scraper with both fingerprinting AND proxy
 */
async function getFullyEnhancedBrowser(forceNewSession = false) {
    const { getEnhancedBrowser } = require('./enhancedScraperUtils');
    const config = scraperConfig.stealth.proxyManager;

    // If proxy manager disabled, use standard enhanced browser
    if (!config.enabled) {
        return await getEnhancedBrowser(forceNewSession);
    }

    // Initialize proxy manager
    const proxyManager = getProxyManager({
        webshareApiKey: config.webshareApiKey,
        minHealthScore: config.minHealthScore,
        healthCheckInterval: config.healthCheckInterval,
        enableHealthCheck: config.enableHealthCheck
    });

    if (proxyManager.proxies.length === 0) {
        console.log('🔄 First time setup: Fetching proxies...');
        await proxyManager.refreshProxies();
    }

    // Get proxy for this session
    const proxy = config.rotationStrategy === 'random'
        ? proxyManager.getRandomProxy()
        : proxyManager.getNextProxy();

    if (proxy) {
        console.log(`🌐 Session proxy: ${proxy.substring(0, 40)}...`);
    }

    // Get enhanced browser with proxy
    const result = await getEnhancedBrowser(forceNewSession);

    // Attach proxy info to session manager
    if (proxy && result.sessionManager) {
        result.sessionManager.currentProxy = proxy;
    }

    return result;
}

module.exports = {
    getEnhancedBrowserWithProxy,
    scrapeWithProxy,
    getProxyStats,
    refreshAllProxies,
    getFullyEnhancedBrowser
};
