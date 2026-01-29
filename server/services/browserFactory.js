const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');

// Add stealth plugin once
puppeteer.use(StealthPlugin());

const USER_AGENTS = [
    // Updated for 2026 (Chrome 145+)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0'
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
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
    const {
        headless = false, // ALWAYS SHOW WINDOW FOR DEBUGGING
        proxy = null,
        userDataDir = scraperConfig.paths.userDataDir,
        useExisting = false // FORCE FRESH: Do not connect to existing browser
    } = options;

    // Try connecting to an existing debug session (Clean Mode)
    if (useExisting) {
        try {
            console.log('🔌 Checking for active Clean Chrome Mode (Port 9222)...');
            const browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            console.log('✅ Connected to existing Chrome instance on port 9222.');
            return browser;
        } catch (e) {
            console.log('ℹ️ No active Clean Chrome Mode found (or port 9222 busy). Launching fresh instance.');
        }
    }

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0', // Visible for manual captcha solving
        '--start-maximized',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-ipc-flooding-protection',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        // New anti-detection flags
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-sync',
        '--no-default-browser-check',
        '--no-first-run',
        '--remote-debugging-port=9222',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--shm-size=1gb',
        // Suppress "Allow this site to access local network devices" prompt
        '--disable-discovery-models',
        '--disable-media-router',
        '--disable-features=OptimizationGuideModelDownloading,OptimizationHintsFetching,OptimizationTargetPrediction,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,AndroidPayIntegrationV1,AndroidPayIntegrationV2,ChromeWhatsNewUI,PrivacySandboxSettings4,UserAgentClientHint',
        '--no-default-browser-check',
        '--disable-notifications',
        '--disable-geolocation',
        '--disable-device-discovery-notifications',
        '--disable-session-crashed-bubble',
        '--disable-restore-session-state',
        // [FIX] Prevent background throttling (Detached Frame fix)
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection'
        // '--incognito' // Disabled to allow visible debugging with profile
    ];

    let finalProxy = proxy;
    if (!finalProxy && scraperConfig.stealth.useProxy) {
        if (scraperConfig.stealth.proxyList && scraperConfig.stealth.proxyList.length > 0) {
            finalProxy = scraperConfig.stealth.proxyList[Math.floor(Math.random() * scraperConfig.stealth.proxyList.length)];
        } else if (scraperConfig.stealth.proxyUrl) {
            finalProxy = scraperConfig.stealth.proxyUrl;
        }
    }

    if (finalProxy) {
        launchArgs.push(`--proxy-server=${finalProxy}`);
    }

    // Ensure user data dir exists
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    // [FIX] Clean up any stale SingletonLock files that cause "Browser already running" errors
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    lockFiles.forEach(file => {
        const lockPath = path.join(userDataDir, file);
        if (fs.existsSync(lockPath)) {
            try {
                console.log(`🧹 Removing stale lock file: ${file}`);
                fs.unlinkSync(lockPath);
            } catch (e) {
                console.warn(`⚠️ Could not remove lock file ${file}: ${e.message}`);
            }
        }
    });

    // Explicitly set executablePath for Render environment
    const launchOptions = {
        headless: headless,
        args: launchArgs,
        userDataDir: userDataDir,
        ignoreDefaultArgs: ['--enable-automation']
    };

    // On production (Render), Chrome is installed via postinstall to node_modules
    const isRenderEnv = process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.PORT;
    if (isRenderEnv) {
        const path = require('path');
        // Try multiple possible locations based on observation
        const possiblePaths = [
            path.join(__dirname, '../node_modules/puppeteer/.local-chromium/chrome/linux-*/chrome-linux64/chrome'),
            path.join(__dirname, '../node_modules/puppeteer/.local-chromium/linux-*/chrome-linux64/chrome'),
            path.join(__dirname, '../../node_modules/puppeteer/.local-chromium/chrome/linux-*/chrome-linux64/chrome'),
            '/opt/render/project/src/server/node_modules/puppeteer/.local-chromium/chrome/linux-*/chrome-linux64/chrome'
        ];

        console.log('Production environment detected. Searching for Chrome...');

        const fs = require('fs');

        // Function to recursively find a file
        function findChrome(startPath) {
            if (!fs.existsSync(startPath)) return null;

            try {
                const files = fs.readdirSync(startPath);
                for (const file of files) {
                    const filePath = path.join(startPath, file);
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        // Look for chrome-linux64 directory specifically
                        if (file === 'chrome-linux64') {
                            const chromePath = path.join(filePath, 'chrome');
                            if (fs.existsSync(chromePath)) {
                                return chromePath;
                            }
                        }
                        const result = findChrome(filePath);
                        if (result) return result;
                    }
                }
            } catch (e) {
                // Ignore access errors
            }
            return null;
        }

        console.log('Searching for Chrome executable manually (recursive)...');
        // Start searching from puppeteer's .local-chromium
        const startPaths = [
            path.join(__dirname, '../node_modules/puppeteer/.local-chromium'),
            path.join(__dirname, '../../node_modules/puppeteer/.local-chromium'),
            '/opt/render/project/src/server/node_modules/puppeteer/.local-chromium'
        ];

        for (const searchDir of startPaths) {
            if (fs.existsSync(searchDir)) {
                console.log('Searching in:', searchDir);
                const found = findChrome(searchDir);
                if (found) {
                    launchOptions.executablePath = found;
                    console.log('✓ Found Chrome executable at:', found);
                    try { fs.chmodSync(found, '755'); } catch (e) { }
                    break;
                }
            }
        }

        if (!launchOptions.executablePath) {
            console.log('✗ Chrome not found. Trying Puppeteer default...');
        }
    } else {
        // [FIX] Local Environment Chrome Fallback
        const commonPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            '/usr/bin/google-chrome',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        ];

        for (const p of commonPaths) {
            if (fs.existsSync(p)) {
                console.log(`✓ Found system Chrome at: ${p}`);
                launchOptions.executablePath = p;
                break;
            }
        }
    }

    let browser;
    try {
        console.log(`🚀 Launching browser with profile: ${launchOptions.userDataDir}`);
        browser = await puppeteer.launch(launchOptions);
    } catch (e) {
        if (e.message.includes('already running') || e.message.includes('EBUSY') || e.message.includes('locked')) {
            console.warn(`⚠️ Profile Locked! Switching to RECOVERY mode... (${e.message.split('\n')[0]})`);

            // Create a unique recovery profile to bypass the lock
            launchOptions.userDataDir += `_RECOVERY_${Date.now()}`;

            if (!fs.existsSync(launchOptions.userDataDir)) {
                fs.mkdirSync(launchOptions.userDataDir, { recursive: true });
            }

            console.log(`♻️ Retrying with RECOVERY profile: ${launchOptions.userDataDir}`);
            browser = await puppeteer.launch(launchOptions);
        } else {
            throw e;
        }
    }

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
    await page.setViewport(randomViewport); // Standard Viewport

    // 3. Basic WebDriver Masking (Lightweight)
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 4. Load Cookies (Self-Healing)
    const cookiePath = scraperConfig.paths.cookies;
    const backupPath = `${cookiePath}.bak`;

    const loadCookies = async (path) => {
        try {
            if (fs.existsSync(path)) {
                const cookiesString = fs.readFileSync(path);
                const cookies = JSON.parse(cookiesString);
                if (cookies.length > 0) {
                    await page.setCookie(...cookies);
                    console.log(`🍪 Restored session from ${path.includes('.bak') ? 'BACKUP' : 'Main'} (${cookies.length} cookies)`);
                    return true;
                }
            }
        } catch (e) {
            console.error(`⚠️ Cookie load error:`, e.message);
        }
        return false;
    };

    // Try Main -> If fail, Try Backup
    let loaded = await loadCookies(cookiePath);
    if (!loaded) {
        // console.warn('⚠️ Main cookie file failed/empty. Attempting backup...');
        await loadCookies(backupPath);
    }

    console.log('✅ Page Configured (Lightweight Stealth Mode)');
}

/**
 * Save browser state (cookies)
 */
/**
 * Save browser state (cookies) with Atomic Write & Backup
 * Prevents file corruption if process crashes during write.
 */
async function saveBrowserState(page) {
    try {
        const cookies = await page.cookies();

        // Don't save empty if we have existing cookies (prevent wiping)
        if (cookies.length === 0) {
            // Check if we effectively lost session?
            // Maybe logging is enough. Don't overwrite good cookies with empty unless we mean to.
            // console.warn('⚠️ Warning: Attempted to save 0 cookies. Skipping to preserve state.');
            // return;
        }

        const cookiePath = scraperConfig.paths.cookies;
        const cookieDir = path.dirname(cookiePath);

        if (!fs.existsSync(cookieDir)) {
            fs.mkdirSync(cookieDir, { recursive: true });
        }

        const tempPath = `${cookiePath}.tmp`;
        const backupPath = `${cookiePath}.bak`;
        const data = JSON.stringify(cookies, null, 2);

        // 1. Atomic Write Strategy: Write to .tmp first
        fs.writeFileSync(tempPath, data);

        // 2. Create Backup of current valid file before overwriting
        if (fs.existsSync(cookiePath)) {
            try {
                fs.copyFileSync(cookiePath, backupPath);
            } catch (e) { /* Ignore backup error */ }
        }

        // 3. Rename .tmp to .json (Atomic operation on same FS)
        try {
            fs.renameSync(tempPath, cookiePath);
            // console.log('💾 Cookies secured (Atomic Save).');
        } catch (e) {
            // Fallback for systems where renameSync might fail across partitions (rare)
            fs.copyFileSync(tempPath, cookiePath);
            fs.unlinkSync(tempPath);
        }

    } catch (e) {
        console.error('⚠️ Failed to save browser state:', e.message);
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
            // Small scroll back to simulate natural reading correction
            if (Math.random() > 0.7) {
                window.scrollBy(0, -Math.floor(distance / 3));
            }
        });
    };

    /**
     * Simulates natural mouse movements to a target using Bezier curves
     */
    page.mouseMoveOrganic = async (x, y) => {
        try {
            const startX = page.mouse._x || 0;
            const startY = page.mouse._y || 0;

            // Generate control points for Bezier curve
            const cp1x = startX + (x - startX) * Math.random();
            const cp1y = startY + (y - startY) * Math.random();
            const cp2x = startX + (x - startX) * Math.random();
            const cp2y = startY + (y - startY) * Math.random();

            const steps = 25 + Math.floor(Math.random() * 25);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const curX = (1 - t) ** 3 * startX + 3 * (1 - t) ** 2 * t * cp1x + 3 * (1 - t) * t ** 2 * cp2x + t ** 3 * x;
                const curY = (1 - t) ** 3 * startY + 3 * (1 - t) ** 2 * t * cp1y + 3 * (1 - t) * t ** 2 * cp2y + t ** 3 * y;

                await page.mouse.move(curX, curY);
                if (i % 5 === 0) await page.randomWait(10, 30);
            }
            // Final micro-adjustment
            await page.mouse.move(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2);
        } catch (e) {
            // Silently fail if mouse move is impossible
        }
    };

    /**
     * Move to element with organic curve
     */
    page.moveToElement = async (selector) => {
        const element = await page.$(selector);
        if (!element) return;
        const box = await element.boundingBox();
        if (!box) return;

        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;
        await page.mouseMoveOrganic(targetX, targetY);
    };
}

module.exports = {
    createStealthBrowser,
    configureStealthPage,
    saveBrowserState,
    humanizePage,
    USER_AGENTS
};
