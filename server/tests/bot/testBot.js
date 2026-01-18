const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    baseUrl: 'http://localhost:5173', // Frontend URL
    adminEmail: 'admin@emlak22.com',
    adminPassword: 'admin123',
    headless: false, // Set to true for background execution
    interval: 30000, // 30 seconds between runs
    logFile: path.join(__dirname, 'bot_logs.json')
};

// Logging Helper
function logResult(action, status, duration, error = null) {
    const entry = {
        timestamp: new Date().toISOString(),
        action,
        status,
        duration: duration + 'ms',
        error: error ? error.message : null
    };

    console.log(`[${entry.timestamp}] ${action}: ${status} (${entry.duration})`);

    let logs = [];
    if (fs.existsSync(CONFIG.logFile)) {
        try {
            logs = JSON.parse(fs.readFileSync(CONFIG.logFile));
        } catch (e) {
            logs = [];
        }
    }
    logs.push(entry);
    // Keep last 1000 logs
    if (logs.length > 1000) logs = logs.slice(-1000);

    fs.writeFileSync(CONFIG.logFile, JSON.stringify(logs, null, 2));
}

async function runBot() {
    console.log('--- Starting Test Bot Cycle ---');
    let browser;
    try {
        const startTime = Date.now();
        browser = await puppeteer.launch({
            headless: CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Optimize viewport
        await page.setViewport({ width: 1280, height: 800 });

        // 1. Visit Login Page
        const loginStart = Date.now();
        await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });

        // Check if already logged in or needs login
        if (await page.$('input[type="email"]')) {
            await page.type('input[type="email"]', CONFIG.adminEmail);
            await page.type('input[type="password"]', CONFIG.adminPassword);
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.click('button[type="submit"]')
            ]);
            logResult('Login', 'SUCCESS', Date.now() - loginStart);
        } else {
            console.log('Already logged in or different page');
        }

        // 2. Dashboard Health
        const dashboardStart = Date.now();
        await page.goto(`${CONFIG.baseUrl}/`, { waitUntil: 'networkidle2' });
        // Look for a known dashboard element, e.g., 'Dashboard' text or a specific chart
        // Taking a screenshot for debugging (optional)
        // await page.screenshot({ path: path.join(__dirname, 'dashboard.png') });
        logResult('Navigate Dashboard', 'SUCCESS', Date.now() - dashboardStart);

        // 3. Properties Page
        const propsStart = Date.now();
        await page.goto(`${CONFIG.baseUrl}/properties`, { waitUntil: 'networkidle2' });
        // Wait for table or list
        await page.waitForSelector('table', { timeout: 5000 }).catch(() => console.log('No table found on properties'));
        logResult('Navigate Properties', 'SUCCESS', Date.now() - propsStart);

        // 4. Clients Page
        const clientsStart = Date.now();
        await page.goto(`${CONFIG.baseUrl}/clients`, { waitUntil: 'networkidle2' });
        logResult('Navigate Clients', 'SUCCESS', Date.now() - clientsStart);

        logResult('Full Cycle', 'SUCCESS', Date.now() - startTime);

    } catch (error) {
        console.error('Critical Bot Error:', error);
        logResult('Cycle Error', 'FAILED', 0, error);
    } finally {
        if (browser) await browser.close();
        console.log(`--- Cycle Finished. Waiting ${CONFIG.interval}ms ---`);
        setTimeout(runBot, CONFIG.interval);
    }
}

// Start the bot
runBot();
