const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const { saveListings } = require('../services/scraperService');

// Platform specific parsers
const parsers = {
    sahibinden: (document) => {
        const rows = document.querySelectorAll('#searchResultsTable tbody tr.searchResultsItem');
        const data = [];
        rows.forEach((row) => {
            const id = row.getAttribute('data-id');
            if (!id) return;
            const urlEl = row.querySelector('a.classifiedTitle');
            let href = urlEl?.getAttribute('href');
            if (href && !href.startsWith('http')) href = 'https://www.sahibinden.com' + href;

            const fullText = row.innerText;
            const m2Match = fullText.match(/(\d+)\s*m[²2]/i);
            const roomsMatch = fullText.match(/(\d+\+\d+)|(Stüdyo)/i);
            const priceEl = row.querySelector('.searchResultsPriceValue div');
            const locEl = row.querySelector('.searchResultsLocationValue');

            let price = 0;
            if (priceEl) {
                const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                price = parseFloat(raw) || 0;
            }

            let district = '', neighborhood = '';
            if (locEl) {
                const txt = locEl.innerText.replace(/\n/g, ' ').trim();
                const parts = txt.split(' ');
                district = parts[0] || '';
                let clean = txt.replace(district, '').replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                neighborhood = clean + ' Mah.';
            }

            data.push({
                external_id: id,
                title: urlEl?.innerText.trim() || 'İsimsiz İlan',
                price: price.toString(),
                url: href || '',
                district,
                neighborhood,
                rooms: roomsMatch ? roomsMatch[0].replace(/\s/g, '') : '',
                size_m2: m2Match ? parseInt(m2Match[1]) : 0,
                listing_date: new Date().toISOString().split('T')[0],
                seller_type: 'office',
                seller_name: 'Sahibinden',
                category: 'daire'
            });
        });
        return data;
    },
    hepsiemlak: (document) => {
        const items = document.querySelectorAll('.listing-item');
        const data = [];
        items.forEach(item => {
            const id = item.id;
            if (!id) return;
            const titleEl = item.querySelector('.list-view-title h3') || item.querySelector('.list-view-title');
            const priceEl = item.querySelector('.list-view-price');
            const locationEl = item.querySelector('.list-view-location');
            const urlEl = item.querySelector('a.card-link');
            const textContent = item.innerText;

            let price = 0;
            if (priceEl) {
                const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                price = parseFloat(raw) || 0;
            }

            let district = '', neighborhood = '';
            if (locationEl) {
                const parts = locationEl.innerText.split('/').map(s => s.trim());
                if (parts.length > 1) district = parts[1];
                if (parts.length > 2) {
                    neighborhood = parts[2].replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim() + ' Mah.';
                }
            }

            const m2Match = textContent.match(/(\d+)\s*m²/);
            const roomMatch = textContent.match(/(\d+\s*\+\s*\d+)/);

            data.push({
                external_id: id,
                title: titleEl?.innerText.trim() || 'İsimsiz İlan',
                price: price.toString(),
                url: urlEl ? 'https://www.hepsiemlak.com' + urlEl.getAttribute('href') : '',
                district,
                neighborhood,
                rooms: roomMatch ? roomMatch[1].replace(/\s/g, '') : '',
                size_m2: m2Match ? parseInt(m2Match[1]) : 0,
                listing_date: new Date().toISOString().split('T')[0],
                seller_type: 'office',
                seller_name: 'Hepsiemlak',
                category: 'daire'
            });
        });
        return data;
    }
};

async function processLocalFile() {
    const args = process.argv.slice(2);
    const platform = args[0] || 'sahibinden';
    const fileName = args[1] || `${platform}.html`;
    const filePath = path.isAbsolute(fileName) ? fileName : path.join(__dirname, fileName);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Dosya bulunamadı: ${filePath}`);
        console.log(`\nKullanım: node process_local_file.js [platform] [dosya_adi]`);
        console.log(`Örnek: node process_local_file.js hepsiemlak listem.html`);
        return;
    }

    if (!parsers[platform]) {
        console.error(`❌ Desteklenmeyen platform: ${platform}. Desteklenenler: ${Object.keys(parsers).join(', ')}`);
        return;
    }

    console.log(`📂 Platform: ${platform}, Dosya: ${fileName} işleniyor...`);

    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const fileUrl = 'file://' + filePath.replace(/\\/g, '/');

    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

    // Inject the parsing strategy logic
    const results = await page.evaluate((platformName, parsersMap) => {
        const parserFnBody = parsersMap[platformName];
        const parserFn = new Function('document', `return (${parserFnBody})(document)`);
        return parserFn(document);
    }, platform, Object.keys(parsers).reduce((acc, key) => {
        acc[key] = parsers[key].toString();
        return acc;
    }, {}));

    console.log(`✅ ${results.length} ilan bulundu.`);
    await browser.close();

    if (results.length > 0) {
        console.log('💾 Veritabanına kaydediliyor...');
        await saveListings(results);
        console.log('🏁 İşlem başarıyla tamamlandı.');
    } else {
        console.log('⚠️ Hiç ilan bulunamadı. HTML dosyasının doğru sayfa (Liste sayfası) olduğundan emin olun.');
    }
}

processLocalFile().catch(console.error);
