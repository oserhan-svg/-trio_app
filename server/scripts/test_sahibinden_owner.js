const { scrapeSahibindenStealth } = require('../services/stealthScraper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OWNER_URL = 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik?a5_min=1&a5_max=1';

async function run() {
    console.log('🏁 Starting TARGETED Owner Scrape...');
    console.log(`URL: ${OWNER_URL}`);
    console.log('━'.repeat(60));

    let scrapedListings = [];
    let successCount = 0;
    let failureCount = 0;

    try {
        // Scrape with FORCED 'owner' type
        console.log('📡 Initiating scraper...');
        scrapedListings = await scrapeSahibindenStealth(OWNER_URL, 'owner');
        console.log(`\n📊 Scraped ${scrapedListings.length} items from Owner URL.`);
        console.log('━'.repeat(60));
    } catch (error) {
        console.error('❌ Scrape Failed:', error.message);
        console.error('Stack:', error.stack);
        console.log('━'.repeat(60));
        console.log('⚠️  Continuing with partial results (if any)...');
    }

    // Save to DB
    if (scrapedListings.length > 0) {
        console.log(`\n💾 Saving ${scrapedListings.length} listings to database...`);

        for (const [index, item] of scrapedListings.entries()) {
            try {
                const { external_id, title, price, url, location, seller_type, rooms: scrapedRooms, size_m2: scrapedM2, listing_date } = item;

                let district = 'Ayvalık'; // Known from URL
                let neighborhood = '';

                if (location.includes('150 Evler')) neighborhood = '150 Evler Mah.';
                if (location.includes('Ali Çetinkaya')) neighborhood = 'Ali Çetinkaya Mah.';

                const rooms = scrapedRooms || 'Bilinmiyor';
                const size_m2 = scrapedM2 || 0;

                const existingProp = await prisma.property.findUnique({ where: { external_id } });

                const data = {
                    title,
                    price: price.toString(),
                    url,
                    district,
                    neighborhood,
                    seller_type,
                    rooms,
                    size_m2,
                    listing_date: (listing_date && !isNaN(new Date(listing_date).getTime())) ? new Date(listing_date) : null,
                    last_scraped: new Date()
                };

                if (existingProp) {
                    await prisma.property.update({ where: { id: existingProp.id }, data });
                    console.log(`✅ [${index + 1}/${scrapedListings.length}] Updated ${external_id} | Rooms: ${rooms} | Date: ${listing_date || 'N/A'}`);
                } else {
                    await prisma.property.create({
                        data: {
                            external_id,
                            ...data,
                        }
                    });
                    console.log(`✨ [${index + 1}/${scrapedListings.length}] Created ${external_id} | Rooms: ${rooms} | Date: ${listing_date || 'N/A'}`);
                }
                successCount++;
            } catch (dbError) {
                console.error(`❌ [${index + 1}/${scrapedListings.length}] Failed to save ${item.external_id}:`, dbError.message);
                failureCount++;
            }
        }
    } else {
        console.log('⚠️  No listings to save.');
    }

    console.log('\n' + '━'.repeat(60));
    console.log('📋 SUMMARY REPORT');
    console.log('━'.repeat(60));
    console.log(`Total Scraped: ${scrapedListings.length}`);
    console.log(`Successfully Saved: ${successCount}`);
    console.log(`Failed to Save: ${failureCount}`);
    console.log(`Listings with Dates: ${scrapedListings.filter(l => l.listing_date).length}`);
    console.log('━'.repeat(60));
    console.log('✅ Done.');

    await prisma.$disconnect();
    process.exit(0);
}

run().catch(error => {
    console.error('💥 Unhandled Error:', error);
    process.exit(1);
});
