const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
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
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
    const {
        headless = isProduction ? 'new' : false, // Headless in production
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
        '--disable-gpu', // Recommended for headless
        '--disable-dev-shm-usage', // Recommended for Docker/Render
        '--shm-size=1gb'
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
    }

    const browser = await puppeteer.launch(launchOptions);

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

    // 4. Randomize Hardware Concurrency, Memory & Touch
    await page.evaluateOnNewDocument(() => {
        const cores = [2, 4, 8, 12, 16];
        const memories = [4, 8, 16, 32];
        const touchPoints = [0, 5, 10]; // 0 for most desktops, 5/10 for touch screens

        const selectedCores = cores[Math.floor(Math.random() * cores.length)];
        const selectedMemory = memories[Math.floor(Math.random() * memories.length)];
        const selectedTouch = touchPoints[Math.floor(Math.random() * touchPoints.length)];

        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => selectedCores });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => selectedMemory });
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => selectedTouch });

        // Randomize Screen Color Depth
        Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
        Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
    });

    // 4.1 Screen Orientation Simulation
    await page.evaluateOnNewDocument(() => {
        if (window.screen && window.screen.orientation) {
            const types = ['landscape-primary', 'landscape-secondary'];
            const type = types[Math.floor(Math.random() * types.length)];
            Object.defineProperty(window.screen.orientation, 'type', { get: () => type });
            Object.defineProperty(window.screen.orientation, 'angle', { get: () => 0 });
        }
    });

    // 5. Add Advanced Client Hints (Anti-Bot evasion for Chrome)
    const isMobile = randomUA.includes('Mobile');
    const platform = randomUA.includes('Windows') ? 'Windows' :
        randomUA.includes('Macintosh') ? 'macOS' :
            randomUA.includes('Linux') ? 'Linux' : 'Chrome OS';

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="24"',
        'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
        'Sec-Ch-Ua-Platform': `"${platform}"`,
        'Referer': 'https://www.google.com/'
    });

    // 6. Mask Canvas & WebGL (Anti-Fingerprinting)
    await page.evaluateOnNewDocument(() => {
        // Canvas Masking
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (type) {
            const context = this.getContext('2d');
            if (context) {
                // Add tiny invisible noise
                const originalFillStyle = context.fillStyle;
                context.fillStyle = 'rgba(255, 255, 255, 0.01)';
                context.fillRect(0, 0, 1, 1);
                context.fillStyle = originalFillStyle;
            }
            return originalToDataURL.apply(this, arguments);
        };

        // WebGL Masking (Small buffer noise)
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
            const value = originalGetParameter.apply(this, arguments);
            // Slightly modify unmaskable params if they match specific IDs (e.g. renderer)
            if (parameter === 37446) return value + ' (Optimized)'; // UNMASKED_RENDERER_WEBGL
            return value;
        };
    });

    // 7. Load Cookies if available
    if (fs.existsSync(scraperConfig.paths.cookies)) {
        try {
            const cookiesString = fs.readFileSync(scraperConfig.paths.cookies);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
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
