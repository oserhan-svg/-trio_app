const { scrapeSahibindenStealth } = require('./services/stealthScraper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OWNER_URL = 'https://www.sahibinden.com/satilik-daire/sahibinden?address_quarter=58386&address_quarter=7084&address_town=128&address_city=10';

async function run() {
    console.log('🏁 Starting TARGETED Owner Scrape...');
    console.log(`URL: ${OWNER_URL}`);

    // Scrape with FORCED 'owner' type
    const listings = await scrapeSahibindenStealth(OWNER_URL, 'owner');

    console.log(`📊 Scraped ${listings.length} items from Owner URL.`);

    // Save to DB
    for (const item of listings) {
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
            listing_date: listing_date ? new Date(listing_date) : null,
            last_scraped: new Date()
        };

        if (existingProp) {
            await prisma.property.update({ where: { id: existingProp.id }, data });
            console.log(`Updated ${external_id} as OWNER. Rooms: ${rooms}`);
        } else {
            await prisma.property.create({
                data: {
                    external_id,
                    ...data,
                }
            });
            console.log(`Created ${external_id} as OWNER. Rooms: ${rooms}`);
        }
    }

    console.log('Done.');
    await prisma.$disconnect();
}

run();
