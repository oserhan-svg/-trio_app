const { scrapeSahibindenTeam } = require('./services/stealthScraper');
const scraperConfig = require('./config/scraperConfig');

async function testTeamScrape() {
    const url = 'https://trioemlakvegayrimenkul.sahibinden.com/ekibimiz';
    console.log(`Testing Team Scrape for: ${url}`);

    try {
        const members = await scrapeSahibindenTeam(url);
        console.log('Result:', JSON.stringify(members, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testTeamScrape();
