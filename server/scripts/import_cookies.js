const fs = require('fs');
const path = require('path');

// Path to where the user should paste their cookies (Array of objects)
const SOURCE_FILE = path.join(__dirname, '../../manual_cookies.json');

// Target directory for the Puppeteer profile used by the scraper
const TARGET_DIR = path.join(__dirname, '../browser_data');
const TARGET_FILE = path.join(TARGET_DIR, 'cookies.json');

async function importCookies() {
    console.log('🍪 Kurabiye (Cookie) İçe Aktarma Başlatıldı...');

    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ Kaynak dosya bulunamadı: ${SOURCE_FILE}`);
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(SOURCE_FILE, 'utf8');
        let cookies = JSON.parse(rawData);

        if (!Array.isArray(cookies)) {
            throw new Error('JSON formatı geçersiz. Bir liste (Array) olmalı.');
        }

        // Clean cookies for Puppeteer/Real-Browser
        const cleanedCookies = cookies.map(c => {
            // Remove leading dot from domain if present (sometimes causes issues in older puppeteer versions)
            // or ensure it has it if required. Standard is usually without for exact, with for subdomains.
            // But let's just make sure it has 'domain' and 'name'
            return {
                name: c.name || c.key,
                value: c.value,
                domain: c.domain,
                path: c.path || '/',
                expires: c.expires || (Date.now() / 1000) + 31536000,
                size: c.size,
                httpOnly: c.httpOnly || false,
                secure: c.secure || false,
                session: c.session || false,
                sameSite: c.sameSite || 'Lax'
            };
        });

        if (!fs.existsSync(TARGET_DIR)) {
            fs.mkdirSync(TARGET_DIR, { recursive: true });
        }

        fs.writeFileSync(TARGET_FILE, JSON.stringify(cleanedCookies, null, 2));
        console.log(`✅ ${cleanedCookies.length} adet çerez temizlendi ve başarıyla aktarıldı: ${TARGET_FILE}`);

    } catch (e) {
        console.error('❌ Hata:', e.message);
    }
}

importCookies();
