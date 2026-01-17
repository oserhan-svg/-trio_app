const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
puppeteer.use(StealthPlugin());
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');


// Critical: Use a persistent profile to save cookies/solver state

async function scrapeSahibindenStealth(url, forcedSellerType = null) {
    console.log(`🕵️ Stealth Scraper Starting for: ${url}`);
    if (forcedSellerType) console.log(`👉 Forcing Seller Type: ${forcedSellerType}`);

    // 1. Get or Launch Browser
    let browser;
    try {
        browser = await getOrLaunchBrowser();
    } catch (e) {
        console.error('❌ Browser Init Failed:', e);
        throw e;
    }

    try {
        const pages = await browser.pages();
        // Try to find an existing Sahibinden tab to reuse (Better for session continuity)
        let page = pages.find(p => p.url().includes('sahibinden.com'));

        if (page) {
            console.log('♻️ Reusing existing Sahibinden tab!');
            await page.bringToFront();
        } else {
            console.log('📄 Opening new tab...');
            page = await browser.newPage();
            try { await page.setViewport({ width: 1920, height: 1080 }); } catch (e) { }
        }

        console.log('Navigating...');

        // Organic Navigation Strategy: Go via Google if not already on Sahibinden
        const currentUrl = page.url();
        if (!currentUrl.includes('sahibinden.com')) {
            console.log('🌍 Organic Mode: Entering via Google Search...');
            try {
                await page.goto('https://www.google.com.tr', { waitUntil: 'domcontentloaded' });
                await new Promise(r => setTimeout(r, 1000));

                // Type search
                const searchBox = await page.$('textarea[name="q"]') || await page.$('input[name="q"]');
                if (searchBox) {
                    await searchBox.type('sahibinden', { delay: 150 });
                    await page.keyboard.press('Enter');
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => { });

                    // Click first result (usually sahibinden.com)
                    const firstResult = await page.waitForSelector('h3', { timeout: 5000 }).catch(() => null);
                    if (firstResult) {
                        console.log('👉 Clicking Google Result...');
                        await firstResult.click();
                        // Wait for some load
                        await new Promise(r => setTimeout(r, 3000));
                    }
                }
            } catch (e) {
                console.log('⚠️ Google warmup failed, falling back to direct navigation:', e.message);
            }
        }

        // Now navigate to the specific target URL
        if (page.url() !== url) {
            console.log(`📍 Going to target URL: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        }

        console.log('Waiting for network idle / challenge...');

        // ANTI-BOT PAUSE MECHANISM
        const checkBlock = async () => {
            const title = await page.title();
            const content = await page.evaluate(() => document.body.innerText);
            if (title.includes('Olağan dışı') ||
                title.includes('Unusual access') ||
                title.includes('Just a moment') || // Cloudflare
                title.includes('Human') || // Verify you are human
                content.includes('Olağan dışı erişim') ||
                content.includes('Olağan dışı erişim tespit ettik') ||
                content.includes('bilgisayar ağı') ||
                content.includes('Basılı tutun') || // Press and Hold
                content.includes('Verify you are human')
            ) {
                console.log('🛑 BLOKLANDI! (Olağan dışı erişim / Cloudflare)');
                console.log('👉 LÜTFEN AÇIK OLAN CHROME PENCERESİNDEN DOĞRULAMAYI ELLE YAPIN.');
                console.log('⏳ Robot bekliyor... (Ekranda "Devam Et" vs varsa basın)');
                process.stdout.write('\x07'); // System Beep to alert user

                // Wait indefinitely until the block is gone
                await page.waitForFunction(() => {
                    const t = document.title;
                    const b = document.body.innerText;
                    return !t.includes('Olağan dışı') &&
                        !t.includes('Unusual') &&
                        !t.includes('Just a moment') &&
                        !t.includes('Human') &&
                        !b.includes('Olağan dışı erişim tespit ettik') &&
                        !b.includes('Basılı tutun');
                }, { timeout: 0, polling: 3000 });

                console.log('✅ Blok çözüldü! Devam ediliyor...');
                await new Promise(r => setTimeout(r, 2000));
            }
        };

        try {
            await checkBlock(); // Initial check

            const title = await page.title();
            if (title.includes('Just a moment') || title.includes('Cloudflare') || title.includes('Human')) {
                console.log('⚠️ Challenge detected. Waiting for manual interaction...');
                console.log('👉 USER ACTION: Please complete the Cloudflare verification on screen!');

                // Wait for navigation or title change indicating success
                await page.waitForFunction(() => !document.title.includes('Just a moment') && !document.title.includes('Cloudflare'), { timeout: 600000 });
                await checkBlock(); // Check again after Cloudflare
            }

            // Final check before trying to parse
            await checkBlock();
        } catch (e) { }

        try {
            console.log('Checking for table...');
            await page.waitForSelector('#searchResultsTable', { timeout: 30000 });
            console.log('✅ Table found!');
        } catch (e) {
            console.log('❌ Table NOT found independently. Maybe manual interaction needed?');
            await new Promise(r => setTimeout(r, 5000));
        }

        const listings = await page.evaluate((forcedType) => {
            const rows = document.querySelectorAll('#searchResultsTable tbody tr.searchResultsItem');
            const data = [];

            rows.forEach(row => {
                const id = row.getAttribute('data-id');
                if (!id) return;

                const urlEl = row.querySelector('a.classifiedTitle');
                const title = urlEl?.innerText.trim() || 'No Title';
                const href = urlEl?.getAttribute('href');
                const fullUrl = href ? 'https://www.sahibinden.com' + href : '';

                const priceEl = row.querySelector('.searchResultsPriceValue div');
                let price = 0;
                if (priceEl) {
                    const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                    price = parseFloat(raw) || 0;
                }

                const locationEl = row.querySelector('.searchResultsLocationValue');
                let location = locationEl ? locationEl.innerText.replace(/\n/g, ' ').trim() : '';

                let district = '';
                let neighborhood = '';

                if (location) {
                    const parts = location.split('/').map(s => s.trim());
                    // Example: Balıkesir / Ayvalık / Ali Çetinkaya Mh.
                    if (parts.length >= 2) district = parts[1];
                    if (parts.length >= 3) {
                        let raw = parts[2];
                        // Normalize "Mh", "Mahallesi" -> "Mah."
                        raw = raw.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                        neighborhood = raw + ' Mah.';
                    }
                }

                // Extra Data Extraction (Rooms, m2, Date)
                let size_m2 = 0;
                let rooms = '';
                let listing_date = null;
                const fullText = row.innerText;
                const textToSearch = fullText + ' ' + title;

                // M2
                const m2Match = textToSearch.match(/(\d+)\s*m[²2]/i);
                if (m2Match) size_m2 = parseInt(m2Match[1]);

                // Rooms
                const roomsMatch = textToSearch.match(/(\d+\+\d+)|(Stüdyo)/i);
                if (roomsMatch) rooms = roomsMatch[0].replace(/\s/g, '');

                // Date
                const dateEl = row.querySelector('.searchResultsDateValue');
                if (dateEl) {
                    const dateText = dateEl.innerText.trim().replace(/\n/g, ' ');
                    const months = {
                        'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
                        'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
                    };
                    const dayMatch = dateText.match(/(\d+)\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)/);
                    if (dayMatch) {
                        const day = dayMatch[1].padStart(2, '0');
                        const monthName = dayMatch[2];
                        const month = months[monthName] || '01';
                        const year = new Date().getFullYear();
                        listing_date = `${year}-${month}-${day}`;
                    }
                }

                let seller_type = forcedType || 'office';

                if (!forcedType) {
                    const lowerText = fullText.toLowerCase();
                    if (lowerText.includes('sahibinden') || lowerText.includes('bireysel')) {
                        seller_type = 'owner';
                    }
                    if (lowerText.includes('emlak ofisi') || lowerText.includes('kurumsal')) seller_type = 'office';
                    if (lowerText.includes('bankadan')) seller_type = 'bank';
                    if (lowerText.includes('inşaat firması')) seller_type = 'construction';
                }

                data.push({ external_id: id, title, price, url: fullUrl, location, district, neighborhood, seller_type, rooms, size_m2, listing_date });
            });
            return data;
        }, forcedSellerType);

        console.log(`🎉 Extracted ${listings.length} listings.`);
        return listings;

    } catch (err) {
        console.error('Scrape Failed:', err);
        if (err.message.includes('connect') || err.message.includes('Target closed')) {
            throw new Error('Chrome bağlantısı koptu. Lütfen "start_chrome_master.bat" dosyasını çalıştırın.');
        }
        throw err;
    } finally {
        if (browser) {
            try {
                // IMPORTANT: Disconnect lets the browser stay open. 
                // We NEVER want to close the master browser or its pages automatically.
                await browser.disconnect();
                console.log('🔌 Disconnected from Master Chrome (Browser stays open)');
            } catch (e) {
                console.log('⚠️ Disconnect warning:', e.message);
            }
        }
    }
}

async function scrapeSahibindenDetails(url) {
    console.log(`--- Scraping Sahibinden Details (${url}) ---`);
    let browser;
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());

    // 1. Get or Launch Browser
    try {
        browser = await getOrLaunchBrowser();
    } catch (e) {
        console.error('❌ Browser Init Failed:', e);
        throw e;
    }

    // 2. Setup Page
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('sahibinden.com'));

    if (page) {
        console.log('♻️ Reusing existing Sahibinden tab for Details!');
        await page.bringToFront();
    } else {
        console.log('📄 Opening new tab for Details...');
        page = await browser.newPage();
        try { await page.setViewport({ width: 1920, height: 1080 }); } catch (e) { }
    }

    // ANTI-BOT PAUSE MECHANISM FOR DETAILS
    const checkBlock = async () => {
        try {
            const title = await page.title();
            const content = await page.evaluate(() => document.body.innerText).catch(() => '');

            // console.log('DEBUG: Title:', title); // Too noisy

            if (title.includes('Olağan dışı') ||
                title.includes('Unusual access') ||
                title.includes('Just a moment') || // Cloudflare
                title.includes('Human') || // Verify you are human
                content.includes('Olağan dışı erişim') ||
                content.includes('Olağan dışı erişim tespit ettik') ||
                content.includes('bilgisayar ağı') ||
                content.includes('Basılı tutun') || // Press and Hold
                content.includes('Verify you are human')
            ) {
                console.log('🛑 DETAY SAYFASI BLOKLANDI! (Olağan dışı erişim / Cloudflare)');
                console.log('👉 LÜTFEN AÇIK OLAN CHROME PENCERESİNDEN DOĞRULAMAYI ELLE YAPIN.');
                console.log('⏳ Robot bekliyor... (Ekranda "Devam Et" vs varsa basın)');
                process.stdout.write('\x07'); // System Beep to alert user

                // Wait indefinitely until the block is gone
                await page.waitForFunction(() => {
                    const t = document.title;
                    const b = document.body.innerText;
                    return !t.includes('Olağan dışı') &&
                        !t.includes('Unusual') &&
                        !t.includes('Just a moment') &&
                        !t.includes('Human') &&
                        !b.includes('Olağan dışı erişim tespit ettik') &&
                        !b.includes('Basılı tutun');
                }, { timeout: 0, polling: 3000 });

                console.log('✅ Blok çözüldü! Devam ediliyor...');
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (e) {
            // CheckBlock failed
        }
    };

    const waitRandom = (min, max) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

    try {
        await checkBlock(); // Initial check

        // Attempt to switch to details tab or ensure we are on the right URL
        // Attempt to switch to details tab or ensure we are on the right URL
        if (page.url() !== url) {
            // If we are already on Sahibinden, simulate "reading" time before clicking next
            if (page.url().includes('sahibinden.com')) {
                console.log('⏳ Simulating human delay before navigating to details...');
                await waitRandom(3000, 6000);
            } else {
                // Set Referer to look like we came from Google
                console.log('🌍 Setting Google Referer...');
                await page.setExtraHTTPHeaders({ 'Referer': 'https://www.google.com/' });
            }

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        }

        await checkBlock(); // Check after navigation

        console.log('⏳ WAITING FOR LISTING DATA...');

        // Wait up to 10 minutes for the user to get to the listing page content
        try {
            await page.waitForSelector('#classifiedDescription', { timeout: 600000 }); // 10 mins
        } catch (e) {
            console.log('Timed out waiting for listing content. Checking for block again...');

            // CAPTURE ERROR SCREENSHOT
            const fs = require('fs');
            const screenshotPath = require('path').join(__dirname, '..', '..', 'error_screenshot.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot saved to: ${screenshotPath}`);

            await checkBlock(); // Late block check
            throw new Error('İlan detayları 10 dakika içinde görüntülenemedi. (Ekran görüntüsü kaydedildi)');
        }

        // Check for 404 / Removed Listing (Quick check after selector found or timeout)
        try {
            const bodyText = await page.evaluate(() => document.body.innerText);
            if (bodyText.includes('Aradığınız sayfa artık bulunamıyor') || bodyText.includes('yayında olmayan')) {
                throw new Error('İlan yayından kaldırılmış veya URL geçersiz.');
            }
        } catch (e) { if (e.message.includes('İlan yayından')) throw e; }

        const details = await page.evaluate(() => {
            const description = document.querySelector('#classifiedDescription')?.innerText.trim() || '';

            // Images logic
            const images = [];
            const potentialImages = [
                ...document.querySelectorAll('.mega-photo-thumnail img'), // Yes, they sometimes have this typo
                ...document.querySelectorAll('.mega-photo-thumbnail img'),
                ...document.querySelectorAll('.thmb img'),
                ...document.querySelectorAll('.classifiedDetailMainPhoto img')
            ];

            potentialImages.forEach(img => {
                if (img.src && !img.src.includes('pixel') && !img.src.includes('blank')) {
                    let highRes = img.src.replace('thmb_', '').replace('x5_', '');
                    if (!images.includes(highRes)) images.push(highRes);
                }
            });

            // Features (Classified Info List) parsing for structured data
            const features = [];
            const infoMap = {};

            const featureEls = document.querySelectorAll('.classifiedInfoList li');
            featureEls.forEach(li => {
                const text = li.innerText.trim();
                features.push(text);
                const label = li.querySelector('strong')?.innerText.trim();
                const value = li.querySelector('span')?.innerText.trim();
                if (label && value) {
                    infoMap[label] = value;
                }
            });

            // Extract structured fields
            let size_m2 = 0;
            if (infoMap['m² (Brüt)']) size_m2 = parseInt(infoMap['m² (Brüt)'].replace('.', '')) || 0;
            if (!size_m2 && infoMap['m² (Net)']) size_m2 = parseInt(infoMap['m² (Net)'].replace('.', '')) || 0;

            let rooms = infoMap['Oda Sayısı'] || null;
            let building_age = infoMap['Bina Yaşı'] || null;
            let floor_location = infoMap['Bulunduğu Kat'] || null;

            // Location
            let district = null;
            let neighborhood = null;
            const breadcrumbs = Array.from(document.querySelectorAll('.classifiedInfo h2 a')).map(a => a.innerText.trim());
            if (breadcrumbs.length >= 2) district = breadcrumbs[1];
            if (breadcrumbs.length >= 3) {
                let raw = breadcrumbs[2];
                raw = raw.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                neighborhood = raw + ' Mah.';
            }

            let seller_name = null;
            const sellerNameEl = document.querySelector('.username-info-area h5');
            if (sellerNameEl) seller_name = sellerNameEl.innerText.trim();

            return { description, images, features, size_m2, rooms, building_age, floor_location, district, neighborhood, seller_name };
        });

        console.log(`✅ Extracted: ${details.description.substring(0, 30)}... | Images: ${details.images.length} | Features: ${details.features.length}`);

        // Validation: If we got absolutely nothing, throw an error
        if ((!details.description || details.description.length < 5) && details.images.length === 0) {
            console.log('❌ Content seemed empty. Selectors might be wrong or page not fully loaded.');
            throw new Error('İlan sayfasına erişildi ancak veri çekilemedi. Sayfa yapısı değişmiş olabilir.');
        }

        return details;

    } catch (err) {
        console.error('Detail Scrape Failed:', err);

        // CRITICAL: Check for block even on error!
        await checkBlock();

        if (err.message.includes('connect') || err.message.includes('Target closed')) {
            throw new Error('Chrome bağlantısı koptu. Lütfen "start_chrome_master.bat" dosyasını çalıştırın.');
        }
        throw err;
    } finally {
        if (browser) {
            try {
                await browser.disconnect();
                console.log('🔌 Disconnected from Master Chrome (Browser stays open)');
            } catch (e) { }
        }
    }
}

if (require.main === module) {
    const TEST_URL = 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-alicetinkaya-mh';
    scrapeSahibindenStealth(TEST_URL);
}

async function getOrLaunchBrowser() {
    try {
        console.log('🔌 Connecting to Master Chrome (Port 9222)...');
        // Try connecting first
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log('✅ Connected to existing Chrome!');
        return browser;
    } catch (err) {
        console.log('⚠️ Existing Chrome not found. Auto-launching Master Chrome...');

        // Path to Chrome - try common locations
        const chromePaths = [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
        ];

        const chromePath = chromePaths.find(p => fs.existsSync(p));

        if (!chromePath) {
            throw new Error('Chrome executable not found. Please install Chrome.');
        }

        // Launch Chrome Process
        const userDataDir = "C:\\chrome-debug-profile";

        // Spawn detached process so it stays alive even if node script ends
        const chromeProcess = spawn(chromePath, [
            '--remote-debugging-port=9222',
            `--user-data-dir=${userDataDir}`,
            '--no-first-run',
            '--no-default-browser-check'
        ], {
            detached: true,
            stdio: 'ignore'
        });

        chromeProcess.unref();

        console.log('🚀 Chrome launched! Waiting for connection...');
        await new Promise(r => setTimeout(r, 4000)); // Wait for Chrome to start

        // Try connecting again
        return await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
    }
}

module.exports = { scrapeSahibindenStealth, scrapeSahibindenDetails, getOrLaunchBrowser };
