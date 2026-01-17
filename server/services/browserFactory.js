const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin once
puppeteer.use(StealthPlugin());

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 }
];

/**
 * Creates a highly stealthy browser instance
 * @param {Object} options - Launch options
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function createStealthBrowser(options = {}) {
    const {
        headless = "new",
        proxy = null,
        userDataDir = null
    } = options;

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-blink-features=AutomationControlled', // Critical for preventing WebDriver detection
        '--disable-features=IsolateOrigins,site-per-process' // Helps with some scraping scenarios
    ];

    if (proxy) {
        launchArgs.push(`--proxy-server=${proxy}`);
    }

    const browser = await puppeteer.launch({
        headless: headless,
        args: launchArgs,
        userDataDir: userDataDir, // Optional: preserve cookies/session
        ignoreDefaultArgs: ['--enable-automation'] // Hide "Chrome is being controlled by automated test software"
    });

    return browser;
}

/**
 * Configures a page with extensive anti-bot evasion measures
 * @param {import('puppeteer').Page} page 
 */
async function configureStealthPage(page) {
    // 1. Randomize User-Agent
    const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(randomUA);

    // 2. Randomize Viewport
    const randomViewport = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
    await page.setViewport(randomViewport);

    // 3. Mask WebDriver (Redundant with StealthPlugin but good backup)
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    // 4. Randomize Hardware Concurrency & Memory
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 + Math.floor(Math.random() * 4) });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 4 + Math.floor(Math.random() * 4) });
    });

    // 5. Add Language Headers
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    });
}

/**
 * Adds human-like behavior to the page
 * @param {import('puppeteer').Page} page 
 */
async function humanizePage(page) {
    // Add random mouse movements or scrolling here if needed
    // For now, just a small random delay helper
    page.randomWait = async (min = 1000, max = 3000) => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    };
}

module.exports = {
    createStealthBrowser,
    configureStealthPage,
    humanizePage,
    USER_AGENTS
};
