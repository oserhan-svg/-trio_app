
const { createStealthBrowser, configureStealthPage } = require('./services/browserFactory');
const scraperConfig = require('./config/scraperConfig');

async function test() {
    let browser;
    try {
        console.log('🚀 Launching browser...');
        browser = await createStealthBrowser({ headless: true });
        const page = await browser.newPage();
        await configureStealthPage(page);

        console.log('🌍 Navigating to Hepsiemlak...');
        await page.goto('https://www.hepsiemlak.com/ayvalik-satilik', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const title = await page.title();
        console.log('📄 Page Title:', title);

        if (title.includes('Just a moment') || title.includes('Verify')) {
            console.log('❌ Cloudflare Blocked!');
        } else {
            console.log('✅ Successfully reached Hepsiemlak!');
            const count = await page.evaluate(() => document.querySelectorAll('.listing-item').length);
            console.log(`🔍 Found ${count} listings on first page.`);
        }

    } catch (e) {
        console.error('❌ Error during test:', e.message);
    } finally {
        if (browser) await browser.close();
    }
}

test();
