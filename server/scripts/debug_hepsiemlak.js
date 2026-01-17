const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const page = await browser.newPage();
        const url = 'https://www.hepsiemlak.com/ayvalik-150-evler-satilik/daire';
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Debug: Check title and items
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        const itemCount = await page.evaluate(() => document.querySelectorAll('.listing-item').length);
        console.log(`Found .listing-item count: ${itemCount}`);

        if (itemCount === 0) {
            console.log('No items found. Dumping body classes...');
            const bodyClasses = await page.evaluate(() => document.body.className);
            console.log(`Body classes: ${bodyClasses}`);
            // Check if there is a "no result" message
            const noResult = await page.evaluate(() => document.body.innerText.includes('Sonuç bulunamadı'));
            console.log(`Includes "Sonuç bulunamadı": ${noResult}`);
        }

        await page.close();
        await browser.disconnect();

    } catch (e) {
        console.error(e);
    }
})();
