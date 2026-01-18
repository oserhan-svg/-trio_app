const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const scraperConfig = require('../config/scraperConfig');

// Add stealth plugin once
puppeteer.use(StealthPlugin());

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0'
];

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1440 }
];

/**
 * Creates a highly stealthy browser instance
 */
async function createStealthBrowser(options = {}) {
    const {
        headless = false, // Default to FALSE for better stealth
        proxy = null,
        userDataDir = scraperConfig.paths.userDataDir
    } = options;

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-notifications',
        '--disable-popup-blocking',
        // New anti-detection flags
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-sync',
        '--no-default-browser-check',
        '--no-first-run'
    ];

    if (proxy) {
        launchArgs.push(`--proxy-server=${proxy}`);
    }

    // Ensure user data dir exists
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: headless,
        args: launchArgs,
        userDataDir: userDataDir,
        ignoreDefaultArgs: ['--enable-automation']
    });

    return browser;
}

/**
 * Configure page with random fingerprinting and load persistent state
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
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 4. Randomize Hardware Concurrency & Memory
    await page.evaluateOnNewDocument(() => {
        const cores = [4, 8, 12, 16];
        const memories = [4, 8, 16, 32];
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores[Math.floor(Math.random() * cores.length)] });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => memories[Math.floor(Math.random() * memories.length)] });
    });

    // 5. Load Cookies if available
    if (fs.existsSync(scraperConfig.paths.cookies)) {
        try {
            const cookiesString = fs.readFileSync(scraperConfig.paths.cookies);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
            // console.log('🍪 Loaded ' + cookies.length + ' cookies.');
        } catch (e) {
            console.error('⚠️ Failed to load cookies:', e.message);
        }
    }
}

/**
 * Save browser state (cookies)
 */
async function saveBrowserState(page) {
    try {
        const cookies = await page.cookies();
        const cookieDir = path.dirname(scraperConfig.paths.cookies);
        if (!fs.existsSync(cookieDir)) {
            fs.mkdirSync(cookieDir, { recursive: true });
        }
        fs.writeFileSync(scraperConfig.paths.cookies, JSON.stringify(cookies, null, 2));
        // console.log('💾 Saved ' + cookies.length + ' cookies.');
    } catch (e) {
        console.error('⚠️ Failed to save state:', e.message);
    }
}

/**
 * Adds human-like behavior to the page
 */
async function humanizePage(page) {
    page.randomWait = async (min = scraperConfig.timeouts.humanDelayMin, max = scraperConfig.timeouts.humanDelayMax) => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    };

    page.randomScroll = async () => {
        await page.evaluate(async () => {
            const distance = Math.floor(Math.random() * 400) + 100;
            window.scrollBy(0, distance);
            await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
            window.scrollBy(0, -Math.floor(distance / 2));
        });
    };
}

module.exports = {
    createStealthBrowser,
    configureStealthPage,
    saveBrowserState,
    humanizePage,
    USER_AGENTS
};
