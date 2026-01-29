require('dotenv').config();
const { scrapeProperties } = require('./services/scraperService');
const prisma = require('./db');

// Parse arguments
const args = process.argv.slice(2);
const isLoop = args.includes('--loop');
const delayStr = args.find(a => a.startsWith('--delay='));
const delayMs = delayStr ? parseInt(delayStr.split('=')[1]) : 3600000; // Default 1 hour

async function runOnce() {
    console.log(`\n🚀 [${new Date().toLocaleTimeString()}] Starting Scraper Run...`);
    try {
        await scrapeProperties('all');
        console.log(`✅ [${new Date().toLocaleTimeString()}] Scraper Run Completed.`);
    } catch (error) {
        console.error('❌ Scraper Run Failed:', error);
    }
}

(async () => {
    if (isLoop) {
        console.log(`♾️ Starting Scraper in LOOP MODE (Interval: ${Math.round(delayMs / 60000)} minutes)`);
        while (true) {
            await runOnce();
            console.log(`⏳ Sleeping for ${Math.round(delayMs / 60000)} minutes...`);
            await new Promise(r => setTimeout(r, delayMs));
        }
    } else {
        await runOnce();
        console.log('👋 Scraping finished. Closing...');
        await prisma.$disconnect();
        process.exit(0);
    }
})();
