
const { scrapeSahibindenStealth } = require('./services/stealthScraper');

async function main() {
    console.log('🚀 Manually Opening Chrome for User...');
    console.log('Navigating to Sahibinden Homepage...');

    // Use a generic URL or just the homepage to open the browser
    // The scraper navigates to the URL provided. Let's send it to a search page or just homepage.
    try {
        await scrapeSahibindenStealth('https://www.sahibinden.com/satilik-daire');
        console.log('✅ Browser closed (script finished).');
    } catch (e) {
        console.error('❌ Error in manual script:', e);
    }
}

main();
