const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');

puppeteer.use(StealthPlugin());

async function extractFromDebug() {
    console.log('🔌 Açık olan Chrome penceresine bağlanılıyor (Port 9222)...');

    try {
        // Connect to existing Chrome
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        console.log('✅ Bağlantı başarılı!');

        // Open a new page to access the domain context or use existing pages
        // We need cookies for specific domains
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();

        console.log('🍪 Çerezler toplanıyor...');

        // We'll grab cookies from the browser context
        const client = await page.target().createCDPSession();
        const { cookies } = await client.send('Network.getAllCookies');

        if (cookies && cookies.length > 0) {
            // Filter relevant cookies? Or just save all
            // Saving all is safer for session integrity

            const cookiePath = scraperConfig.paths.cookies;
            // Ensure dir exists
            if (!fs.existsSync(path.dirname(cookiePath))) {
                fs.mkdirSync(path.dirname(cookiePath), { recursive: true });
            }

            fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));

            // --- VISUAL FEEDBACK FOR USER ---
            const sahibindenCount = cookies.filter(c => c.domain.includes('sahibinden.com')).length;
            const hepsiemlakCount = cookies.filter(c => c.domain.includes('hepsiemlak.com')).length;
            const otherCount = cookies.length - sahibindenCount - hepsiemlakCount;

            console.log('\n==================================================');
            console.log('📊 ÇEREZ RAPORU');
            console.log('==================================================');
            console.log(`🏠 Sahibinden.com : ${sahibindenCount > 0 ? '✅ ' + sahibindenCount + ' adet' : '❌ BULUNAMADI'}`);
            console.log(`🏢 Hepsiemlak.com : ${hepsiemlakCount > 0 ? '✅ ' + hepsiemlakCount + ' adet' : '❌ BULUNAMADI'}`);
            console.log(`🌐 Diğer Siteler  : ${otherCount} adet`);
            console.log('--------------------------------------------------');
            console.log(`💾 TOPLAM KAYIT   : ${cookies.length} adet`);
            console.log(`📂 Dosya Yolu     : ${cookiePath}`);
            console.log('==================================================\n');

            if (sahibindenCount === 0 && hepsiemlakCount === 0) {
                console.warn('⚠️  UYARI: Hedef sitelere ait çerez görünmüyor!');
                console.warn('   Lütfen Chrome penceresinde sitelere giriş yaptığınızdan emin olun.');
            } else {
                console.log('👍 İşlem başarılı! Scraper artık bu oturumları kullanabilir.');
            }
        } else {
            console.warn('⚠️  Hiç çerez bulunamadı. Lütfen Chrome''da sitelere giriş yaptığınızdan emin olun.');
        }

        await browser.disconnect();

    } catch (e) {
        console.error('❌ HATA: Chrome''a bağlanılamadı.');
        console.error('   Lütfen Chrome''un "Hata Ayıklama Modunda" açık olduğundan emin olun.');
        console.error('   Detay: ' + e.message);
        process.exit(1);
    }
}

extractFromDebug();
