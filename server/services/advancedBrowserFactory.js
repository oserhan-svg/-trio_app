const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');

// Add stealth plugin
puppeteer.use(StealthPlugin());

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
];

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1440 },
    { width: 1366, height: 768 },
    { width: 1600, height: 900 }
];

/**
 * Creates enhanced stealth browser with advanced fingerprinting
 */
/**
 * Creates enhanced stealth browser with advanced fingerprinting
 */
async function createAdvancedStealthBrowser(options = {}) {
    // FORCE SAFE DEFAULTS (Borrowed from working browserFactory.js)
    const {
        headless = false,
        proxy = null,
        userDataDir = scraperConfig.paths.userDataDir,
        useExisting = false
    } = options;

    if (useExisting) {
        try {
            console.log('🔌 Checking for active Clean Chrome Mode (Port 9222)...');
            const browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            console.log('✅ Connected.');
            return browser;
        } catch (e) {
            console.log('ℹ️ Launching fresh instance.');
        }
    }

    // SAFE LAUNCH ARGS (Verified working in test_visible.js)
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
        // Minimal Stealth
        '--disable-component-update',
        '--disable-domain-reliability',
        '--no-default-browser-check',
        '--remote-debugging-port=9222',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--shm-size=1gb',
        '--disable-notifications',
        '--disable-geolocation',
        '--disable-restore-session-state'
    ];

    let finalProxy = proxy;
    if (!finalProxy && scraperConfig.stealth.useProxy) {
        // ... (Proxy logic preserved)
    }

    if (finalProxy) {
        launchArgs.push(`--proxy-server=${finalProxy}`);
    }

    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    // Lock file cleanup
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    lockFiles.forEach(file => {
        try { if (fs.existsSync(path.join(userDataDir, file))) fs.unlinkSync(path.join(userDataDir, file)); } catch (e) { }
    });

    const launchOptions = {
        headless: headless,
        args: launchArgs,
        userDataDir: userDataDir,
        ignoreDefaultArgs: ['--enable-automation']
    };

    // System Chrome Scan (Identical to browserFactory)
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log('🖥️ Using local Chrome executable:', p);
            launchOptions.executablePath = p;
            break;
        }
    }

    const browser = await puppeteer.launch(launchOptions);
    return browser;
}

/**
 * Enhanced page configuration with advanced fingerprinting
 */
async function configureAdvancedStealthPage(page) {
    // 1. Randomize User-Agent
    const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(randomUA);

    // 2. Randomize Viewport
    const randomViewport = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
    await page.setViewport(randomViewport);

    // 3. Core Anti-Detection
    await page.evaluateOnNewDocument(() => {
        // WebDriver masking
        Object.defineProperty(navigator, 'webdriver', { get: () => false });

        // Remove automation indicators
        delete navigator.__proto__.webdriver;

        // Languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['tr-TR', 'tr', 'en-US', 'en']
        });
    });

    // 4. Hardware Randomization
    await page.evaluateOnNewDocument(() => {
        const cores = [2, 4, 8, 12, 16];
        const memories = [4, 8, 16, 32];
        const touchPoints = [0, 5, 10];

        const selectedCores = cores[Math.floor(Math.random() * cores.length)];
        const selectedMemory = memories[Math.floor(Math.random() * memories.length)];
        const selectedTouch = touchPoints[Math.floor(Math.random() * touchPoints.length)];

        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => selectedCores });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => selectedMemory });
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => selectedTouch });

        Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
        Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
    });

    // 5. **NEW: Audio Context Fingerprinting**
    await page.evaluateOnNewDocument(() => {
        const audioContext = window.AudioContext || window.webkitAudioContext;
        if (audioContext) {
            // Add noise to audio fingerprint
            const originalGetChannelData = AudioBuffer.prototype.getChannelData;
            AudioBuffer.prototype.getChannelData = function (channel) {
                const originalData = originalGetChannelData.call(this, channel);
                // Add tiny random noise
                for (let i = 0; i < originalData.length; i++) {
                    originalData[i] += (Math.random() - 0.5) * 0.0000001;
                }
                return originalData;
            };

            // Randomize audio context properties
            const OriginalAudioContext = audioContext;
            window.AudioContext = window.webkitAudioContext = function () {
                const context = new OriginalAudioContext();
                const originalCreateOscillator = context.createOscillator.bind(context);
                context.createOscillator = function () {
                    const oscillator = originalCreateOscillator();
                    const originalStart = oscillator.start.bind(oscillator);
                    oscillator.start = function (when) {
                        // Add tiny timing variation
                        return originalStart(when + Math.random() * 0.0001);
                    };
                    return oscillator;
                };
                return context;
            };
        }
    });

    // 6. **NEW: Font Enumeration Masking**
    await page.evaluateOnNewDocument(() => {
        // Randomize font availability to reduce fingerprint uniqueness
        if (document.fonts && document.fonts.check) {
            const originalCheck = document.fonts.check.bind(document.fonts);
            document.fonts.check = function (font, text) {
                // Randomly hide/show 5% of fonts to create variance
                if (Math.random() < 0.05) {
                    return !originalCheck(font, text);
                }
                return originalCheck(font, text);
            };
        }
    });

    // 7. **NEW: Battery API Removal** (reduces fingerprint surface)
    await page.evaluateOnNewDocument(() => {
        if ('getBattery' in navigator) {
            delete navigator.getBattery;
        }
        // Also remove battery promises if they exist
        if (navigator.battery) {
            delete navigator.battery;
        }
    });

    // 8. **Enhanced: WebRTC Leak Prevention**
    await page.evaluateOnNewDocument(() => {
        // Disable WebRTC to prevent IP leaks
        const originalRTCPeerConnection = window.RTCPeerConnection;
        window.RTCPeerConnection = function (...args) {
            const pc = new originalRTCPeerConnection(...args);
            // Prevent local IP detection
            const originalCreateOffer = pc.createOffer.bind(pc);
            pc.createOffer = function (options) {
                if (options && options.offerToReceiveVideo !== undefined) {
                    delete options.offerToReceiveVideo;
                }
                if (options && options.offerToReceiveAudio !== undefined) {
                    delete options.offerToReceiveAudio;
                }
                return originalCreateOffer(options);
            };
            return pc;
        };
    });

    // 9. **Enhanced: Plugin Array Randomization**
    await page.evaluateOnNewDocument(() => {
        // Create realistic but varied plugin array
        const pluginTemplates = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chromium PDF Plugin', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Microsoft Edge PDF Plugin', filename: 'edge-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'pdf-viewer' }
        ];

        // Randomly include 1-3 plugins
        const numPlugins = Math.floor(Math.random() * 3) + 1;
        const selectedPlugins = [];
        for (let i = 0; i < numPlugins; i++) {
            const template = pluginTemplates[Math.floor(Math.random() * pluginTemplates.length)];
            selectedPlugins.push(template);
        }

        Object.defineProperty(navigator, 'plugins', {
            get: () => selectedPlugins.map((p, idx) => ({
                ...p,
                length: 1,
                description: p.name,
                [idx]: { type: 'application/pdf' }
            }))
        });
    });

    // 10. Canvas & WebGL Masking (existing but enhanced)
    await page.evaluateOnNewDocument(() => {
        // Enhanced Canvas Masking
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (type) {
            const context = this.getContext('2d');
            if (context) {
                // Add unique but subtle noise per session
                const noiseLevel = 0.01 + Math.random() * 0.02; // 1-3% noise
                const originalFillStyle = context.fillStyle;
                context.fillStyle = `rgba(255, 255, 255, ${noiseLevel})`;
                context.fillRect(0, 0, 1, 1);
                context.fillStyle = originalFillStyle;
            }
            return originalToDataURL.apply(this, arguments);
        };

        // Enhanced WebGL Masking
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
            const value = originalGetParameter.apply(this, arguments);
            // Add noise to renderer/vendor strings
            if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
                const suffixes = [' (Optimized)', ' Enhanced', ' Pro', ''];
                return value + suffixes[Math.floor(Math.random() * suffixes.length)];
            }
            if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
                return value;
            }
            return value;
        };
    });

    // 11. Screen Orientation
    await page.evaluateOnNewDocument(() => {
        if (window.screen && window.screen.orientation) {
            const types = ['landscape-primary', 'landscape-secondary'];
            const type = types[Math.floor(Math.random() * types.length)];
            Object.defineProperty(window.screen.orientation, 'type', { get: () => type });
            Object.defineProperty(window.screen.orientation, 'angle', { get: () => 0 });
        }
    });

    // 12. Enhanced Client Hints
    const isMobile = randomUA.includes('Mobile');
    const platform = randomUA.includes('Windows') ? 'Windows' :
        randomUA.includes('Macintosh') ? 'macOS' :
            randomUA.includes('Linux') ? 'Linux' : 'Chrome OS';

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="24"',
        'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
        'Sec-Ch-Ua-Platform': `"${platform}"`,
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Upgrade-Insecure-Requests': '1'
    });

    // 13. Load Cookies if available
    if (fs.existsSync(scraperConfig.paths.cookies)) {
        try {
            const cookiesString = fs.readFileSync(scraperConfig.paths.cookies);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
        } catch (e) {
            console.error('⚠️ Failed to load cookies:', e.message);
        }
    }

    console.log('✨ Advanced stealth configuration applied');
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
            if (Math.random() > 0.7) {
                window.scrollBy(0, -Math.floor(distance / 3));
            }
        });
    };

    page.mouseMoveOrganic = async (x, y) => {
        try {
            const startX = page.mouse._x || 0;
            const startY = page.mouse._y || 0;

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
            await page.mouse.move(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2);
        } catch (e) {
            // Silently fail
        }
    };

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
    createAdvancedStealthBrowser,
    configureAdvancedStealthPage,
    saveBrowserState,
    humanizePage,
    USER_AGENTS
};
