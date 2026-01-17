const { scrapeProperties } = require('./services/scraperService');

(async () => {
    console.log("🚀 Manually triggering scraper...");
    try {
        await scrapeProperties('hepsiemlak'); // Start with Hepsiemlak as it is more stable
    } catch (e) {
        console.error("Scraper failed:", e);
    }
    console.log("✅ Manual scrape finished.");
    process.exit(0);
})();
