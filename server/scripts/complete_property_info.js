const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const puppeteer = require('puppeteer-extra');
const prisma = require('../db');
const { scrapeDetails } = require('../services/scraperService');
const { humanizePage } = require('../services/browserFactory');

async function completeMissingInfo() {
    console.log('🔗 BAŞLATILIYOR: EKSİK BİLGİ TAMAMLAMA GÖREVİ...');
    console.log('--------------------------------------------------');

    try {
        // 1. Identify missing properties
        const properties = await prisma.property.findMany({
            where: {
                OR: [
                    { seller_phone: null },
                    { seller_phone: '' },
                    { description: null },
                    { description: '' },
                    { images: { equals: [] } }
                ],
                status: 'active'
            },
            orderBy: { last_scraped: 'asc' }, // Prioritize those not checked lately
            take: 30
        });

        if (properties.length === 0) {
            console.log('✅ Eksik bilgi içeren ilan bulunamadı.');
            return;
        }

        console.log(`📝 ${properties.length} ilan için detaylar çekilecek.`);

        // 2. Connect to browser
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const pages = await browser.pages();
        let page = pages.find(p => p.url().includes('sahibinden.com') || p.url().includes('hepsiemlak.com')) || pages[0];

        // Humanize the page
        await humanizePage(page);

        for (const prop of properties) {
            console.log(`🔍 İşleniyor [${prop.id}]: ${prop.url}`);
            try {
                // Pre-navigation random wait to be more human
                const waitTime = 5000 + Math.random() * 5000;
                await new Promise(r => setTimeout(r, waitTime));

                // Scrape details using the attached page
                const details = await scrapeDetails(prop.url, page);

                if (details.isRemoved) {
                    console.log(`⚠️ İlan yayından kalkmış: ${prop.id}`);
                    await prisma.property.update({
                        where: { id: prop.id },
                        data: { status: 'removed', last_scraped: new Date() }
                    });
                    continue;
                }

                // Update DB
                await prisma.property.update({
                    where: { id: prop.id },
                    data: {
                        description: details.description || prop.description,
                        images: (details.images && details.images.length > 0) ? details.images : prop.images,
                        features: details.features || prop.features,
                        size_m2: details.size_m2 || prop.size_m2,
                        rooms: details.rooms || prop.rooms,
                        heating_type: details.heating_type || prop.heating_type,
                        building_age: details.building_age || prop.building_age,
                        floor_location: details.floor_location || prop.floor_location,
                        seller_name: details.seller_name || prop.seller_name,
                        seller_phone: details.seller_phone || prop.seller_phone,
                        last_scraped: new Date(),
                        status: 'active'
                    }
                });

                console.log(`✅ Başarıyla güncellendi: ${prop.id}`);

                // Longer delay to avoid bot detection
                await new Promise(r => setTimeout(r, 10000 + Math.random() * 10000));

            } catch (err) {
                if (err.message.includes('Execution context was destroyed')) {
                    console.log('⚠️ Context hatası, sayfa yenileniyor...');
                    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => { });
                    await humanizePage(page);
                } else if (err.message.includes('Olağan dışı') || err.message.includes('Unusual')) {
                    console.log('🛑 BLOK TESPİT EDİLDİ! Görev durduruluyor.');
                    break;
                } else {
                    console.error(`❌ Hata (${prop.id}):`, err.message);
                }
            }
        }

        await browser.disconnect();
        console.log('🏁 GÖREV TAMAMLANDI.');

    } catch (e) {
        console.error('❌ KRİTİK HATA:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

completeMissingInfo();
