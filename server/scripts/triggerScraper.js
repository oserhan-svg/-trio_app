const { scrapeProperties } = require('./services/scraperService');

(async () => {
    try {
        console.log('Manually triggering scraper...');
        await scrapeProperties();
        console.log('Scraper finished execution.');
        process.exit(0);
    } catch (error) {
        console.error('Error running scraper:', error);
        process.exit(1);
    }
})();
