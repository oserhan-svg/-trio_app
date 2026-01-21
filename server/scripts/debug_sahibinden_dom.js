const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        const browserURL = 'http://127.0.0.1:9222';
        const browser = await puppeteer.connect({ browserURL });
        console.log('✅ Connected to browser.');

        const pages = await browser.pages();
        const page = pages.find(p => p.url().includes('sahibinden.com'));

        if (!page) {
            console.log('❌ No Sahibinden tab found.');
            browser.disconnect();
            return;
        }

        console.log(`📄 Inspecting page: ${page.url()}`);

        const result = await page.evaluate(() => {
            const row = document.querySelector('.searchResultsItem:not(.nativeAd)');
            if (!row) return { error: 'No listing row found' };

            const locationEl = row.querySelector('.searchResultsLocationValue');
            const allClasses = Array.from(row.querySelectorAll('*')).map(el => el.className);

            return {
                foundLocationEl: !!locationEl,
                locationText: locationEl ? locationEl.innerText : 'N/A',
                locationHTML: locationEl ? locationEl.innerHTML : 'N/A',
                rowHTML: row.innerHTML.substring(0, 500) // First 500 chars of row
            };
        });

        console.log('--- DOM INSPECTION RESULT ---');
        console.log(result);

        browser.disconnect();

    } catch (e) {
        console.error('Error:', e);
    }
})();
