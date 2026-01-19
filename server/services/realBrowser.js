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

    // Fallback: Default to null and let library try, or throw friendly error
    // On Render, we usually need correct path to avoid 'ChromePathNotSetError'
    return null;
}

async function launchRealBrowser(options = {}) {
    console.log('🚀 Launching Real Browser (Puppeteer-Real-Browser)...');

    // Attempt to find chrome
    const chromePath = findChromeExecutable();

    // Render specific config
    const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';

    // If on Render and no xvfb, we might need 'headless: "new"' to avoid crash,
    // BUT real-browser recommends headless: false. 
    // We try headless: false first, if it fails, the library usually warns.
    // However, without Xvfb on Linux, headless: false WILL crash.
    // So for Render, we MUST use headless: true (new) OR use xvfb-run in start command.
    // Since we can't change start command easily right now, we use headless: true as fallback.
    // But real-browser often works best with headful.

    // Strategy: Use the found path. Pass it to customConfig.

    try {
        const { browser, page } = await connect({
            headless: isRender ? 'new' : false, // Auto-switch for Render
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
                userDataDir: scraperConfig.paths.userDataDir // Persistence
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
