
const { launchRealBrowser } = require('../services/realBrowser');

(async () => {
    console.log('🐞 Starting Debug Scraper Hang (Via Service)...');

    try {
        console.log('1. Calling launchRealBrowser()...');
        const { browser, page } = await launchRealBrowser();

        console.log('2. Browser launched. Checking initial URL...');
        console.log('   Current URL:', page.url());

        if (page.url() === 'about:blank') {
            console.log('⚠️ Page is on about:blank. Attempting manual navigation...');
        }

        console.log('3. Navigating to a safe test page (Google)...');
        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('   Navigation complete. Title:', await page.title());

        console.log('4. Now testing Sahibinden navigation...');
        await page.goto('https://www.sahibinden.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('   Sahibinden Title:', await page.title());

        await browser.close();
        console.log('✅ Debug run finished successfully.');

    } catch (error) {
        console.error('❌ Debug run FAILED:', error);
    }
})();
