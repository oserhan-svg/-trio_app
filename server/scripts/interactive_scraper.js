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

        console.log('🌍 Tarayıcı açıldı. (Google.com)');
        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });

        console.log('🚦 TALİMATLAR:');
        console.log('1. Google\'a "Sahibinden" yazın ve aratın.');
        console.log('2. İlk sonuca tıklayarak siteye girin (Bu, bot algılamasını aşar).');
        console.log('3. Eğer giriş yapmanız gerekiyorsa yapın.');
        console.log('4. Bot, siz ana sayfaya veya ilan listesine ulaştığınızda otomatik başlayacak.');

        // Wait for user to navigate to target domain
        await page.waitForFunction(() => {
            return window.location.href.includes('sahibinden.com') &&
                !document.title.includes('Bir dakika') &&
                !document.title.includes('Just a moment') &&
                !document.title.includes('Doğrulama');
        }, { timeout: 0, polling: 1000 }); // Wait forever

        console.log('✅ Sahibinden.com algılandı! Bot devreye giriyor...');

        // Short delay to let things settle
        await new Promise(r => setTimeout(r, 3000));

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
