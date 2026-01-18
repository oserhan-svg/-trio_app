const { scrapeProperties } = require('../services/scraperService');

(async () => {
    console.log("🚀 Manually triggering scraper...");
    try {
        await scrapeProperties('sahibinden'); // Focus on the most difficult anti-bot target
    } catch (e) {
        console.error("Scraper failed:", e);
    }
    console.log("✅ Manual scrape finished.");
    process.exit(0);
})();
