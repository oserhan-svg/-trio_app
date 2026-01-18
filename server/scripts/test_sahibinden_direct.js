const { scrapeSahibindenStealth } = require('../services/stealthScraper');
const prisma = require('../db');

// Ali Çetinkaya
const URL = 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-alicetinkaya-mh';

async function run() {
    console.log('🏁 Starting Direct Sahibinden Test...');
    const listings = await scrapeSahibindenStealth(URL);

    console.log(`📊 Scraped ${listings.length} items.`);
    const owners = listings.filter(l => l.seller_type === 'owner');
    console.log(`👤 Owner Listings found: ${owners.length}`);

    if (listings.length > 0) {
        console.log('Example Listing:', listings[0]);
    }
}

run();
