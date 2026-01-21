const { scrapeDetails } = require('../services/scraperService');

async function testScraper() {
    // A sample Hepsiemlak or Sahibinden URL to test
    // We'll use a dummy one or try to find one from DB if possible, but let's try a known structure
    const testUrl = 'https://www.hepsiemlak.com/ayvalik-satilik/daire'; // This is a search page, but scrapeDetails expects a detail page.

    // Let's try to mock a detail page or just see if it launches at all
    // Better: let's try to find a property in DB to test against
    const prisma = require('../db');

    try {
        const prop = await prisma.property.findFirst({
            where: {
                status: 'active',
                url: { contains: 'hepsiemlak' }
            }
        });

        if (!prop) {
            console.log('No active Hepsiemlak property found to test.');
            return;
        }

        console.log(`Testing scrape for: ${prop.url}`);

        try {
            const details = await scrapeDetails(prop.url);
            console.log('✅ Success:', details);
        } catch (e) {
            console.error('❌ Failed:', e);
        }

    } catch (dbErr) {
        console.error('DB Error:', dbErr);
    } finally {
        await prisma.$disconnect();
    }
}

testScraper();
