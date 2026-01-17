const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');
const prisma = require('./db');
const { findMatches } = require('./services/matchService');

async function processLocalFile() {
    const filePath = path.join(__dirname, 'sahibinden.html');

    if (!fs.existsSync(filePath)) {
        console.error('❌ Dosya bulunamadı: sahibinden.html');
        console.error('Lütfen dosyayı "server" klasörüne kaydedin.');
        return;
    }

    console.log(`📂 Dosya okunuyor: ${filePath}`);

    // Launch headless since we are just reading a local file
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Convert path to file URL
    const fileUrl = 'file://' + filePath.replace(/\\/g, '/');
    console.log(`Navigating to ${fileUrl}`);

    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

    // Reuse the exact same parsing logic from scraperService
    const listings = await page.evaluate(() => {
        const rows = document.querySelectorAll('#searchResultsTable tbody tr.searchResultsItem');
        const data = [];

        rows.forEach((row, index) => {
            const id = row.getAttribute('data-id');
            if (!id) return;

            const urlEl = row.querySelector('a.classifiedTitle');
            const title = urlEl?.innerText.trim() || 'İsimsiz İlan';
            // Construct real URL since clicking in local file won't work perfectly, but the href is usually relative/absolute
            let href = urlEl?.getAttribute('href');
            if (href && !href.startsWith('http')) href = 'https://www.sahibinden.com' + href;
            const url = href || '';

            const fullText = row.innerText;
            let size_m2 = 0;
            let rooms = '';

            const m2Match = fullText.match(/(\d+)\s*m[²2]/i);
            if (m2Match) size_m2 = parseInt(m2Match[1]);

            const roomsMatch = fullText.match(/(\d+\+\d+)|(Stüdyo)/i);
            if (roomsMatch) rooms = roomsMatch[0].replace(/\s/g, '');

            const priceEl = row.querySelector('.searchResultsPriceValue div');
            const locEl = row.querySelector('.searchResultsLocationValue');
            const dateEl = row.querySelector('.searchResultsDateValue');

            let price = 0;
            if (priceEl) {
                const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                price = parseFloat(raw) || 0;
            }

            let district = '';
            let neighborhood = '';
            if (locEl) {
                const txt = locEl.innerText.replace(/\n/g, ' ').trim();
                const parts = txt.split(' ');
                if (parts.length > 1) district = parts[0];
                let rawNeighborhood = txt;
                if (district && rawNeighborhood.startsWith(district)) {
                    rawNeighborhood = rawNeighborhood.replace(district, '').trim();
                }
                let clean = rawNeighborhood.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                neighborhood = clean + ' Mah.';
            }

            // Basic date parsing logic
            let listing_date = new Date().toISOString().split('T')[0]; // Default to today

            data.push({ external_id: id, title, price, url, district, neighborhood, rooms, size_m2, listing_date });
        });
        return data;
    });

    console.log(`✅ ${listings.length} ilan bulundu.`);
    await browser.close();

    // Save to DB
    await saveListings(listings);
}

async function saveListings(listings) {
    if (listings.length === 0) return;
    console.log(`Veritabanına kaydediliyor...`);

    for (const item of listings) {
        const { external_id, title, price, url, district, neighborhood, rooms, size_m2, listing_date } = item;

        const existingProp = await prisma.property.findUnique({
            where: { external_id: external_id }
        });

        if (!existingProp) {
            await prisma.property.create({
                data: {
                    external_id, title, price: price.toString(), url, district, neighborhood, rooms, size_m2,
                    listing_date: listing_date ? new Date(listing_date) : null,
                    last_scraped: new Date()
                }
            });
            console.log(`[Yeni] ${title}`);
        } else {
            // Update
            await prisma.property.update({
                where: { id: existingProp.id },
                data: { title, url, price: price.toString(), last_scraped: new Date() }
            });
            console.log(`[Güncel] ${title}`);
        }
    }
    console.log('🏁 İşlem tamamlandı.');
}

processLocalFile().catch(console.error);
