const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        console.log('🧹 Connecting to Master Chrome to clear data...');
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const pages = await browser.pages();
        // Find any sahibinden page or open a new one
        let page = pages.find(p => p.url().includes('sahibinden.com'));
        if (!page) {
            page = await browser.newPage();
            await page.goto('https://www.sahibinden.com', { waitUntil: 'domcontentloaded' }).catch(() => { });
        }

        console.log('🍪 Clearing Cookies...');
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');

        console.log('🗑️ Clearing Local Storage...');
        await page.evaluate(() => {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) { }
        });

        console.log('🔄 Refreshing Page...');
        await page.reload({ waitUntil: 'domcontentloaded' });

        console.log('✅ Data Cleared & Page Refreshed!');
        await browser.disconnect();

    } catch (e) {
        console.error('❌ Failed to clear data:', e.message);
    }
})();
