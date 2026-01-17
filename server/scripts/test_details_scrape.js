const { scrapeDetails } = require('./services/scraperService');

// Use a known live URL or just a sample from 150 Evler if available
// Or I can hardcode one from previous logs if I had it, but searching DB is better.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const prop = await prisma.property.findFirst({
            where: { url: { contains: 'hepsiemlak' } }
        });

        if (!prop) {
            console.log('No Hepsiemlak property found to test.');
            return;
        }

        console.log(`Testing Scrape Details on: ${prop.url}`);
        const details = await scrapeDetails(prop.url);

        console.log('--- Result ---');
        console.log('Description Length:', details.description.length);
        console.log('Images Count:', details.images.length);
        console.log('Features Count:', details.features.length);
        console.log('First Image:', details.images[0]);
        console.log('First Feature:', details.features[0]);

    } catch (e) {
        console.error(e);
    }
}

test();
