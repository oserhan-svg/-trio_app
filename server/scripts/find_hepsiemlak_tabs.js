const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const URL = 'https://www.hepsiemlak.com/ayvalik-ali-cetinkaya-satilik/daire';

async function findTabs() {
    console.log('🕵️ Asking Hepsiemlak for the "Sahibinden" tab URL...');
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        // Wait a bit
        await new Promise(r => setTimeout(r, 3000));

        // Look for links with text "Sahibinden"
        const links = await page.evaluate(() => {
            // Usually these tabs are top of valid list
            // class might be .list-category or similar
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .filter(a => a.innerText.trim() === 'Sahibinden' || a.innerText.includes('Sahibinden'))
                .map(a => ({ text: a.innerText.trim(), href: a.href }));
        });

        console.log('🔗 Found Links:', JSON.stringify(links, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

findTabs();
