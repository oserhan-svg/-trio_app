const { scrapeEmlakjet } = require('./services/scraperService');
const { createStealthBrowser } = require('./services/browserFactory');

async function testEmlakjetFix() {
    console.log('🚀 Starting Emlakjet Fix Verification...');
    let browser;
    try {
        browser = await createStealthBrowser({ headless: false });
        const page = await browser.newPage();

        // Use a standard search URL
        const TEST_URL = 'https://www.emlakjet.com/satilik-daire/balikesir-ayvalik/';

        console.log('Testing scrapeEmlakjet with single page...');
        // Signature: (page, url, forcedSellerType, category, targetPages)
        const listings = await scrapeEmlakjet(page, TEST_URL, null, 'residential', [1]);

        console.log('---------------------------------------------------');
        console.log(`✅ Success! Scraped ${listings.length} listings.`);
        if (listings.length > 0) {
            console.log('Sample Listing:', listings[0].title);
        }
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        if (browser) await browser.close();
        process.exit();
    }
}

testEmlakjetFix();
