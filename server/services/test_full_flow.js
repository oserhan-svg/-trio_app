const { scrapeSahibindenStealth, scrapeSahibindenDetails } = require('./stealthScraper');

async function testFullFlow() {
    console.log('🚀 Starting Full Flow Test...');
    try {
        // 1. Scrape List
        console.log('📋 Step 1: Scraping List...');
        const listings = await scrapeSahibindenStealth('https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-alicetinkaya-mh');

        if (listings.length === 0) {
            console.error('❌ No listings found in step 1.');
            return;
        }

        const firstListing = listings[0];
        console.log(`✅ List Scrape Success. Found ${listings.length} items.`);
        console.log(`👉 Picking first item: ${firstListing.title}`);
        console.log(`🔗 URL: ${firstListing.url}`);

        if (!firstListing.url || !firstListing.url.includes('sahibinden.com')) {
            console.error('❌ Invalid URL for detail scrape.');
            return;
        }

        // 2. Scrape Details
        console.log('📄 Step 2: Scraping Details...');
        // Add a small pause here like the dashboard would have
        await new Promise(r => setTimeout(r, 2000));

        const details = await scrapeSahibindenDetails(firstListing.url);
        console.log('✅ Detail Scrape Success!', details);

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
    }
}

testFullFlow();
