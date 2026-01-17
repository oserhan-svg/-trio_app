const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        console.log('🔌 Connecting to check IP...');
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        const page = await browser.newPage();
        await page.goto('https://api.ipify.org?format=json', { waitUntil: 'networkidle2' });
        const content = await page.evaluate(() => document.body.innerText);
        console.log('🌐 CURRENT IP:', content);

        // Brief delay to let user see it if they are watching
        await new Promise(r => setTimeout(r, 2000));

        await page.close();
        await browser.disconnect();
    } catch (e) {
        console.error('❌ Failed to check IP:', e.message);
    }
})();
