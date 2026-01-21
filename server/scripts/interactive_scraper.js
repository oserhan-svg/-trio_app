const { launchRealBrowser } = require('../services/realBrowser');
const { scrapeProperties } = require('../services/scraperService');

async function runInteractiveScraper() {
    console.log('🎮 INTERACTIVE SCRAPER MODE (İnsan Taklidi Modu) 🎮');
    console.log('--------------------------------------------------');
    console.log('ℹ️  Tarayıcı açılacak. Lütfen Captcha veya Giriş işlemini kendiniz yapın.');
    console.log('ℹ️  Siteye sorunsuz eriştiğinizde bot otomatik olarak veri çekmeye başlayacak.');
    console.log('--------------------------------------------------');

    try {
        const { browser, page } = await launchRealBrowser({ headless: false });

        console.log('🌍 Sahibinden.com açılıyor...');
        // Navigating to a generic page first to allow human interaction
        await page.goto('https://www.sahibinden.com/', { waitUntil: 'domcontentloaded' });

        console.log('⏳ KULLANICI BEKLENİYOR: Lütfen tarayıcıda Captcha/Cloudflare engelini aşın.');
        console.log('   Eğer giriş yapmanız gerekiyorsa yapın.');
        console.log('   Bot sayfayı izliyor, ana sayfa veya ilan listesi yüklendiğinde otomatik başlayacak...');

        // Wait for user to bypass block
        await page.waitForFunction(() => {
            const title = document.title;
            const body = document.body.innerText;
            const blockage = title.includes('Bir dakika') || title.includes('Just a moment') || body.includes('Olağandışı') || body.includes('Access Denied');
            return !blockage && (document.querySelector('.homepage') || document.querySelector('#container') || document.querySelector('.mega-menu'));
        }, { timeout: 300000, polling: 1000 }); // 5 minutes wait

        console.log('✅ Erişim Başarılı! Bot devreye giriyor...');

        // Start scraping using the EXISTING page
        // We focus only on Sahibinden for now as requested
        await scrapeProperties('sahibinden', page);

        console.log('🏁 İşlem tamamlandı. Tarayıcıyı kapatıyorum.');
        await browser.close();

    } catch (e) {
        console.error('❌ Hata oluştu:', e.message);
        process.exit(1);
    }
}

runInteractiveScraper();
