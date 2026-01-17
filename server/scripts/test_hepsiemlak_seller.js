const { scrapeProperties } = require('./services/scraperService');

async function test() {
    console.log('Running Hepsiemlak DUAL Scrape Test...');
    await scrapeProperties('hepsiemlak');
}

test();
