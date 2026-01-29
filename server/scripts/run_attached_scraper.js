const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const puppeteer = require('puppeteer-extra');
const { scrapeProperties } = require('../services/scraperService');

async function attachAndScrape() {
    console.log('🔗 MEVCUT CHROME TARAYICISINA BAĞLANILIYOR...');
    console.log('--------------------------------------------------');

    try {
        // Attempt to connect to localhost:9222
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        console.log('✅ Bağlantı başarılı!');
        const pages = await browser.pages();

        // Find a tab that is either blank or sahibinden, or just use the first/active one
        let page = pages.find(p => p.url().includes('sahibinden.com'));

        if (!page) {
            console.log('ℹ️ Sahibinden sekmesi bulunamadı. Aktif sekmeyi kullanıyorum...');
            // Find the most recently used/active page usually implicitly the last one or we check visibilityState?
            // Puppeteer pages array order is not guaranteed active tab first.
            // Let's just pick the last open page (often the active one)
            page = pages[pages.length - 1];

            console.log('🌍 Sahibinden.com\'a yönlendiriliyor...');
            await page.goto('https://www.sahibinden.com/', { waitUntil: 'domcontentloaded' });
        } else {
            console.log('♻️ Açık Sahibinden sekmesi bulundu.');
            await page.bringToFront();
        }

        console.log(`📄 Aktif Sayfa: ${await page.title()}`);
        console.log('🚀 Scraper başlatılıyor (Bu pencerede çalışacak)...');

        // Inject the page into scrapeProperties
        // This will bypass launchRealBrowser and use this page
        await scrapeProperties('sahibinden', page);

        console.log('✅ İşlem tamamlandı.');
        // We do NOT close the browser as it is the user's main browser
        await browser.disconnect();

    } catch (e) {
        console.error('❌ BAĞLANTI HATASI:', e.message);
        console.log('\n⚠️ DİKKAT: Bu modun çalışması için Chrome\'un özel bir parametre ile başlatılması gerekir.');
        console.log('   Lütfen "chrome_debug_modu.bat" dosyasını çalıştırdığınızdan emin olun.');
        console.log('   Ve Chrome\'un daha önce tamamen kapalı olduğundan emin olun.');
    }
}

attachAndScrape();
