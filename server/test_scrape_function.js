const { scrapeSahibindenDetails } = require('./services/stealthScraper');

async function testScrape() {
    const url = 'https://www.sahibinden.com/ilan/emlak-konut-kiralik-cunda-adasinda-mustakil-girisli-esyali-esyasiz-kiralik-3-plus1-1286409869/detay';
    console.log(`Testing Scrape: ${url}`);

    try {
        const data = await scrapeSahibindenDetails(url);
        console.log('--- SCRAPE RESULT ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Scrape Error:', e);
    }
}

testScrape();
