const { connect } = require('puppeteer-real-browser');
const scraperConfig = require('../config/scraperConfig');
const fs = require('fs');
const path = require('path');

function findChromeExecutable() {
    const fs = require('fs');
    const path = require('path');

    // 1. Check common environment variables
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }

    // 2. Common Paths (Windows/Linux/Mac)
    const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    // Add Local AppData (User-specific install) for Windows
    if (process.env.LOCALAPPDATA) {
        commonPaths.push(path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'));
    }

    for (const p of commonPaths) {
        if (fs.existsSync(p)) {
            console.log(`✅ Found System Chrome: ${p}`);
            return p;
        }
    }

    // 3. Search in standard local-chromium locations (Render/Docker)
    // This part handles the "Production" nested folder logic
    console.log('Searching for Chrome in local modules...');

    // Function to recursively find a file
    function findRecursive(startPath) {
        if (!fs.existsSync(startPath)) return null;
        try {
            const files = fs.readdirSync(startPath);
            for (const file of files) {
                const fullPath = path.join(startPath, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (file === 'chrome-linux64' || file === 'chrome-win') {
                        const execLinux = path.join(fullPath, 'chrome');
                        const execWin = path.join(fullPath, 'chrome.exe');
                        if (fs.existsSync(execLinux)) return execLinux;
                        if (fs.existsSync(execWin)) return execWin;
                    }
                    // Limit recursion depth/scope if needed, but standard node_modules structure is fine
                    const res = findRecursive(fullPath);
                    if (res) return res;
                }
            }
        } catch (e) { }
        return null;
    }

    const possibleRoots = [
        path.join(__dirname, '../node_modules/puppeteer/.local-chromium'),
        path.join(__dirname, '../../node_modules/puppeteer/.local-chromium'),
        '/opt/render/project/src/server/node_modules/puppeteer/.local-chromium',
        // Generic node_modules search
        path.join(__dirname, '../node_modules'),
    ];

    for (const root of possibleRoots) {
        const found = findRecursive(root);
        if (found) {
            console.log(`✅ Found Local Chrome: ${found}`);
            return found;
        }
    }

    return null;
}

async function launchRealBrowser(options = {}) {
    console.log('🚀 Launching Real Browser (Puppeteer-Real-Browser)...');

    // Attempt to find chrome
    const chromePath = findChromeExecutable();

    // Ensure User Data Dir exists to prevent log file errors (ENOENT)
    const userDataDir = scraperConfig.paths.userDataDir;
    if (!fs.existsSync(userDataDir)) {
        try {
            console.log(`📁 Creating user data directory at: ${userDataDir}`);
            fs.mkdirSync(userDataDir, { recursive: true });
        } catch (err) {
            console.error('❌ Failed to create user data directory:', err);
        }
    }

    if (chromePath) {
        console.log(`🔧 Setting CHROME_PATH env var to: ${chromePath}`);
        process.env.CHROME_PATH = chromePath;
    } else {
        console.warn('⚠️ Chrome executable not found! real-browser might fail.');
    }

    // Render specific config
    const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';

    try {
        const { browser, page } = await connect({
            headless: isRender ? 'new' : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--mute-audio',
                '--window-size=1920,1080'
            ],
            customConfig: {
                executablePath: chromePath, // Explicit path
                userDataDir: userDataDir // Persistence
            },
            turnstile: true,
            disableXvfb: isRender, // Disable Xvfb check if we are on Render (prevent error throw)
            ignoreAllFlags: false
        });

        // Inject Cookies
        await loadImportedCookies(page);

        return { browser, page };
    } catch (e) {
        console.error('❌ Failed to launch Real Browser:', e);
        throw e;
    }
}

async function loadImportedCookies(page) {
    const cookiePath = scraperConfig.paths.cookies;
    if (fs.existsSync(cookiePath)) {
        try {
            console.log(`🍪 Loading imported cookies from: ${cookiePath}`);
            const cookiesString = fs.readFileSync(cookiePath, 'utf8');
            const cookies = JSON.parse(cookiesString);

            // Filter valid cookies (domain/url matching is handled by browser, but we ensure format)
            if (Array.isArray(cookies) && cookies.length > 0) {
                await page.setCookie(...cookies);
                console.log(`✅ ${cookies.length} cookies injected successfully.`);
            }
        } catch (e) {
            console.error('⚠️ Failed to load imported cookies:', e.message);
        }
    } else {
        console.log('ℹ️ No imported cookies found (manual_cookies.json not processed). Using clean session.');
    }
}

module.exports = { launchRealBrowser };
