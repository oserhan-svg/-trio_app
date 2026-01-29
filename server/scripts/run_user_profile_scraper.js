const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { scrapeProperties } = require('../services/scraperService');
const path = require('path');

puppeteer.use(StealthPlugin());

async function runWithUserProfile() {
    console.log('👤 Running Scraper with USER PROFILE...');

    // Path to user's Chrome data
    // CAUTION: User must close their actual Chrome browser first for this to work due to lock files.
    const userDataDir = 'C:\\Users\\ozanc\\AppData\\Local\\Google\\Chrome\\User Data';

    try {
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: userDataDir,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--ignore-certificate-errors',
                '--disable-blink-features=AutomationControlled'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        console.log('✅ Browser launched with user profile.');

        // Pass the browser or page to scraper service?
        // scraperService usually manages its own browser, but we can modify it or pass page if supported.
        // Looking at interactive_scraper.js, it seems we can pass the page?
        // Actually scrapeProperties in scraperService.js accepts (source, existingPage = null)

        const page = await browser.newPage();
        await scrapeProperties('sahibinden', page);

        console.log('🏁 Scrape finished.');
        // Don't close browser immediately to let user see
        // await browser.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('💡 TIP: Make sure all Chrome windows are CLOSED before running this script.');
    }
}

runWithUserProfile();
