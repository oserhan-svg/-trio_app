const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const URL = 'https://www.hepsiemlak.com/ayvalik-ali-cetinkaya-satilik/daire';

async function inspectHepsiemlak() {
    console.log('🕵️ Inspecting Hepsiemlak HTML Structure...');
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        // Wait for listings
        await page.waitForSelector('.listing-item');

        const firstItemHTML = await page.evaluate(() => {
            const item = document.querySelector('.listing-item');
            return item ? item.outerHTML : 'No Item Found';
        });

        console.log('--- First Listing HTML ---');
        console.log(firstItemHTML);
        console.log('--------------------------');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

inspectHepsiemlak();
