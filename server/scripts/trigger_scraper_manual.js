const { scrapeProperties } = require('../services/scraperService');

(async () => {
    console.log("🚀 Manually triggering scraper...");
    try {
        await scrapeProperties('all'); // Run full scrape job (Sahibinden + Hepsiemlak + Others)
    } catch (e) {
        console.error("Scraper failed:", e);
    }
    console.log("✅ Manual scrape finished.");
    process.exit(0);
})();
