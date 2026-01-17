const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');

const USER_DATA_DIR = path.join(__dirname, '..', 'chrome-stealth-profile');
const URL = 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-alicetinkaya-mh';

async function findFilter() {
    console.log('🕵️ Asking Sahibinden for the "Sahibinden" (From Owner) filter URL...');
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: USER_DATA_DIR,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    try {
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        // Wait for potential challenge (reuse logic if needed, but manual is fast for this test)
        await new Promise(r => setTimeout(r, 5000));

        // Look for links in the sidebar or filter area containing "Sahibinden"
        const links = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .filter(a => a.innerText.includes('Sahibinden') || a.innerText.includes('Bireysel'))
                .map(a => ({ text: a.innerText.trim(), href: a.href }));
        });

        console.log('🔗 Found Links:', JSON.stringify(links, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

findFilter();
