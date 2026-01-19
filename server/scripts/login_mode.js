const { launchRealBrowser } = require('../services/realBrowser');
const { saveBrowserState } = require('../services/browserFactory');
const fs = require('fs');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');

async function startLoginMode() {
    console.log('🔐 LOGIN MODE BAŞLATILIYOR...');
    console.log('--------------------------------------------------');
    console.log('ℹ️  Tarayıcı açıldığında lütfen sitelere giriş yapın (Sahibinden, Hepsiemlak).');
    console.log('ℹ️  Kullanıcı adı ve şifrenizi girip "Beni Hatırla" seçeneğini işaretleyin.');
    console.log('ℹ️  Giriş yaptıktan sonra bu pencereyi kapatabilirsiniz.');
    console.log('--------------------------------------------------');

    try {
        // Force headful mode for interaction
        process.env.RENDER = 'false'; // Ensure local mode
        process.env.NODE_ENV = 'development';

        const { browser, page } = await launchRealBrowser({ headless: false });

        console.log('🌍 Tarayıcı açıldı. Sahibinden.com adresine gidiliyor...');
        await page.goto('https://secure.sahibinden.com/giris', { waitUntil: 'domcontentloaded' });

        // Monitor cookies periodically
        const interval = setInterval(async () => {
            if (browser.isConnected()) {
                const cookies = await page.cookies();
                if (cookies.length > 0) {
                    // Save to cookies.json
                    const cookiePath = scraperConfig.paths.cookies;
                    if (!fs.existsSync(path.dirname(cookiePath))) {
                        fs.mkdirSync(path.dirname(cookiePath), { recursive: true });
                    }
                    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
                    process.stdout.write(`\r💾 Çerezler kaydedildi: ${cookies.length} adet.`);
                }
            } else {
                clearInterval(interval);
                console.log('\n❌ Tarayıcı kapandı. İşlem sonlandırılıyor.');
                process.exit(0);
            }
        }, 5000);

        // Keep process alive until user closes browser
        browser.on('disconnected', () => {
            console.log('\n👋 Tarayıcı bağlantısı kesildi. Çıkış yapılıyor...');
            process.exit(0);
        });

    } catch (e) {
        console.error('❌ Hata oluştu:', e);
    }
}

startLoginMode();
