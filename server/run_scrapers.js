const { scrapeProperties } = require('./services/scraperService');
const prisma = require('./db');

(async () => {
    console.log('🚀 Starting Full Scraper Run...');
    try {
        // Run for 'all' (Sahibinden + Hepsiemlak) and 'all' categories
        await scrapeProperties('all');
        console.log('✅ Scraper Run Completed Successfully.');
    } catch (error) {
        console.error('❌ Scraper Run Failed:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
})();
