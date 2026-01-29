const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpDetails() {
    const url = 'https://shbd.io/s/test'; // We will use a real URL in the actual run, or just navigate to one.
    // Real URL from previous check: 
    const targetUrl = 'https://www.sahibinden.com/ilan/emlak-konut-kiralik-cunda-adasinda-mustakil-girisli-esyali-esyasiz-kiralik-3-plus1-1286409869/detay';

    console.log(`Analyzing: ${targetUrl}`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Anti-detect
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 5000)); // Wait for render

        // Dump User Info Section
        const debugInfo = await page.evaluate(() => {
            return {
                h5: document.querySelector('.username-info-area h5')?.innerText,
                uName: document.querySelector('.user-info-module .u-name')?.innerText,
                storeName: document.querySelector('.storeInfo')?.innerText,
                consultantName: document.querySelector('.consultant-name')?.innerText,
                sidebarText: (document.querySelector('.user-info-module') || document.querySelector('.username-info-area'))?.innerText
            };
        });

        console.log('--- SELECTOR DEBUG ---');
        console.log('H5:', debugInfo.h5);
        console.log('uName:', debugInfo.uName);
        console.log('StoreName:', debugInfo.storeName);
        console.log('ConsultantName:', debugInfo.consultantName);
        console.log('SidebarText:', debugInfo.sidebarText);
        console.log('----------------------');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

dumpDetails();
