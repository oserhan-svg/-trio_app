
const { scrapeDetails } = require('../services/scraperService');
const prisma = require('../db');

async function testScrape() {
    const url = 'https://www.hepsiemlak.com/ayvalik-satilik/daire/45955610';
    console.log('Scraping:', url);
    try {
        const data = await scrapeDetails(url);
        console.log('Scraped Images:', data.images.length);
        data.images.forEach((img, idx) => {
            console.log(`${idx}: ${img}`);
        });

        // Update DB
        await prisma.property.update({
            where: { id: 4826 },
            data: {
                images: data.images,
                description: data.description
            }
        });
        console.log('Database updated.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testScrape();
