const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass self-signed cert for notifications
const puppeteer = require('puppeteer-extra');
const { scrapeProperties } = require('../services/scraperService');

async function syncHepsiemlakPortfolio() {
    console.log('🔗 BAĞLATILIYOR: HEPSIEMLAK PORTFÖY SYNC GÖREVİ...');
    console.log('--------------------------------------------------');

    try {
        // Attempt to connect to localhost:9222
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        console.log('✅ Bağlantı başarılı!');
        const pages = await browser.pages();
        let page = pages.find(p => p.url().includes('hepsiemlak.com')) || pages[0];

        console.log(`📄 Aktif Sayfa: ${await page.title()}`);
        console.log('🚀 Hepsiemlak Sync başlatılıyor...');

        // We only want to run the Hepsiemlak Store part, but scrapeProperties runs everything.
        // I should probably export a smaller function or just run scrapeProperties and rely on config.
        // Since scrapeProperties is what we normally run, let's use it.
        // It will first do Sahibinden Phases -1 and 0, then Hepsiemlak Store Sync.

        await scrapeProperties('hepsiemlak', page);

        console.log('✅ İşlem tamamlandı.');
        await browser.disconnect();

    } catch (e) {
        console.error('❌ HATA:', e.message);
    }
}

syncHepsiemlakPortfolio();
