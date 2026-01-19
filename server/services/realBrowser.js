const { connect } = require('puppeteer-real-browser');
const scraperConfig = require('../config/scraperConfig');

async function launchRealBrowser(options = {}) {
    console.log('🚀 Launching Real Browser (Puppeteer-Real-Browser)...');

    // On Render, we might need to handle Xvfb for headless:false behavior
    // But this library often manages its own chrome.

    try {
        const { browser, page } = await connect({
            headless: false, // Required for this lib to be effective usually
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials'
            ],
            customConfig: {},
            turnstile: true, // Auto-solve Turnstile
            disableXvfb: false, // Use Xvfb if available (Linux)
            ignoreAllFlags: false
        });

        return { browser, page };
    } catch (e) {
        console.error('❌ Failed to launch Real Browser:', e);
        throw e;
    }
}

module.exports = { launchRealBrowser };
