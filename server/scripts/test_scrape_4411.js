
const { scrapeDetails } = require('../services/scraperService');
const prisma = require('../db');

async function test() {
    console.log('--- Starting Test ---');
    try {
        const property = await prisma.property.findUnique({ where: { id: 4411 } });
        if (!property) {
            console.error('Property 4411 not found');
            return;
        }
        console.log(`Testing scrape for URL: ${property.url}`);

        const details = await scrapeDetails(property.url);
        console.log('Scrape Result:', JSON.stringify(details, null, 2));

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
