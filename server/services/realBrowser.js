const { connect } = require('puppeteer-real-browser');
const scraperConfig = require('../config/scraperConfig');
const fs = require('fs');
const path = require('path');

function findChromeExecutable() {
    // 1. Check common environment variables
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }

    // 2. Search in standard local-chromium locations (Render/Docker)
    const possibleRoots = [
        path.join(__dirname, '../node_modules/puppeteer/.local-chromium'),
        path.join(__dirname, '../../node_modules/puppeteer/.local-chromium'),
        '/opt/render/project/src/server/node_modules/puppeteer/.local-chromium'
    ];

    console.log('Searching for Chrome executable for real-browser...');

    function findRecursive(startPath) {
        if (!fs.existsSync(startPath)) return null;
        try {
            const files = fs.readdirSync(startPath);
            for (const file of files) {
                const fullPath = path.join(startPath, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (file === 'chrome-linux64') {
                        const exec = path.join(fullPath, 'chrome');
                        if (fs.existsSync(exec)) return exec;
                    }
                    const res = findRecursive(fullPath);
                    if (res) return res;
                }
            }
        } catch (e) { }
        return null;
    }

    for (const root of possibleRoots) {
        const found = findRecursive(root);
        if (found) {
            console.log(`✅ Found Chrome: ${found}`);
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

        return { browser, page };
    } catch (e) {
        console.error('❌ Failed to launch Real Browser:', e);
        throw e;
    }
}

module.exports = { launchRealBrowser };
