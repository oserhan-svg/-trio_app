const { createStealthBrowser, saveBrowserState, humanizePage } = require('./browserFactory');
const scraperConfig = require('../config/scraperConfig');

/**
 * Checks for known blocking pages/titles
 */
async function checkBlock(page) {
    try {
        const title = await page.title();
        const content = await page.evaluate(() => document.body.innerText).catch(() => '');

        const isBlocked = scraperConfig.selectors.blockIndicators.some(indicator =>
            title.includes(indicator) || content.includes(indicator)
        );

        if (isBlocked) {
            console.log('🛑 DETECTED BLOCK! Waiting for manual intervention...');
            process.stdout.write('\x07'); // Bell sound

            // Wait until block clears
            await page.waitForFunction((indicators) => {
                const t = document.title;
                const b = document.body.innerText;
                return !indicators.some(i => t.includes(i) || b.includes(i));
            }, { timeout: 0, polling: 2000 }, scraperConfig.selectors.blockIndicators);

            console.log('✅ Block cleared! Resuming...');
            await saveBrowserState(page); // Save trust after solving
            await new Promise(r => setTimeout(r, 2000));
        }
    } catch (e) {
        // Ignore errors during block check (e.g. navigation)
    }
}

/**
 * Performs side quests to build a trust-worthy browsing history
 */
async function performSideQuest(page) {
    const sideQuests = [
        'https://www.trthaber.com/',
        'https://tr.wikipedia.org/wiki/Ayval%C4%B1k',
        'https://www.google.com.tr/search?q=ayval%C4%B1k+hava+durumu'
    ];

    const target = sideQuests[Math.floor(Math.random() * sideQuests.length)];
    console.log(`🧭 Performing Side-Quest: ${target}`);

    try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.randomWait(3000, 7000);
        await page.randomScroll();
        if (Math.random() > 0.5) {
            // Click a random link on side-quest page
            const links = await page.$$('a');
            if (links.length > 5) {
                const randomLink = links[Math.floor(Math.random() * 10)];
                await randomLink.click().catch(() => { });
                await page.randomWait(2000, 4000);
            }
        }
    } catch (e) {
        console.log(`⚠️ Side-Quest partial fail: ${e.message}`);
    }
}

/**
 * Performs organic warmup behaviors
 */
async function organicWarmup(page) {
    if (page.url().includes('sahibinden.com')) {
        console.log('♻️ Already on target domain, skipping warmup.');
        return;
    }

    console.log('🌍 Performing Organic Warmup...');
    try {
        await page.goto('https://www.google.com.tr', { waitUntil: 'domcontentloaded' });
        await humanizePage(page);
        await page.randomWait(1000, 2000);

        const searchBox = await page.$('textarea[name="q"]') || await page.$('input[name="q"]');
        if (searchBox) {
            const queries = ['sahibinden satılık', 'ayvalık emlak', 'sahibinden kiralık'];
            await searchBox.type(queries[Math.floor(Math.random() * queries.length)], { delay: 100 });
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => { });

            // Random scroll on search results
            await page.randomScroll();

            // Click a result if possible, else go direct
            const link = await page.$('a[href*="sahibinden.com"]');
            if (link) {
                await Promise.all([
                    page.waitForNavigation({ timeout: 60000 }).catch(() => { }),
                    link.click()
                ]);
            }
        }
    } catch (e) {
        console.log('⚠️ Warmup partial fail, proceeding:', e.message);
    }
}

async function scrapeSahibindenStealth(url, forcedSellerType = null, category = 'residential') {
    const { saveListings } = require('./scraperService');
    console.log(`🕵️ Stealth Scraper Starting for: ${url} [Category: ${category}]`);

    let browser;
    try {
        browser = await getOrLaunchBrowser();
        if (!browser) throw new Error('Browser initialization failed.');

        const pages = await browser.pages();
        let page = pages.find(p => p.url().includes('sahibinden.com'));

        if (page) {
            console.log('♻️ Reusing existing Sahibinden tab!');
            await page.bringToFront();
            await humanizePage(page); // Re-attach utilities
        } else {
            console.log('📄 Opening new tab...');
            page = await browser.newPage();
            try { await page.setViewport({ width: 1920, height: 1080 }); } catch (e) { }
            await humanizePage(page);
            await organicWarmup(page);
        }

        let allListings = [];
        let pageNum = 0;
        const maxPages = 5;
        let hasNextPage = true;

        while (hasNextPage && pageNum < maxPages) {
            const offset = pageNum * 20;
            const pageUrl = url.includes('?') ? `${url}&pagingOffset=${offset}` : `${url}?pagingOffset=${offset}`;
            console.log(`📍 Page ${pageNum + 1}: Visiting ${pageUrl}`);

            // Navigate with random delay
            if (page.url() !== pageUrl) {
                // Before navigating, move mouse randomly
                await page.mouseMoveOrganic('body');
                await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });
            }

            // Enhanced block checking
            try {
                const title = await page.title();
                if (title.includes('Access Denied') || title.includes('Olağandışı')) {
                    console.log('🛑 Forbidden/Access Denied detected!');
                    await rebootProfile();
                    throw new Error('403_BLOCK_REBOOT');
                }
                await checkBlock(page);
            } catch (blockErr) {
                if (blockErr.message === '403_BLOCK_REBOOT') throw blockErr;
            }

            // Occasionally perform side-quest to stay "human"
            if (pageNum > 0 && pageNum % 2 === 0) {
                await performSideQuest(page);
                // Return to original target
                console.log('🏡 Returning to target page...');
                await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });
                await page.randomWait(2000, 4000);
            }

            // Random scroll to simulate browsing
            await page.randomScroll();

            // Random mouse jitter near some elements
            await page.mouseMoveOrganic('.searchResultsItem');

            const selector = scraperConfig.selectors.listingRow || '.searchResultsItem';

            // Wait for table or list items
            try {
                await page.waitForFunction(() =>
                    document.querySelectorAll('.searchResultsItem').length > 0 ||
                    document.querySelectorAll('.classified:not(.header)').length > 0
                    , { timeout: scraperConfig.timeouts.element });
            } catch (e) {
                console.log('❌ Listings not found (Timeout). End of results?');
                break;
            }

            // Extract Data
            const pageListings = await page.evaluate((forcedType, selector) => {
                // Check if we are in Store Mode (div.classified)
                const storeItems = document.querySelectorAll('.classified:not(.header)');
                if (storeItems.length > 0) {
                    // Store Mode Extraction
                    const data = [];
                    storeItems.forEach(row => {
                        const urlEl = row.querySelector('.info .title a') || row.querySelector('.image a');
                        if (!urlEl) return;

                        const title = urlEl.innerText.trim();
                        const fullUrl = urlEl.href;
                        const idMatch = fullUrl.match(/-(\d+)\/detay/);
                        const id = idMatch ? idMatch[1] : null; // Fallback if no ID found
                        if (!id) return;

                        const priceEl = row.querySelector('.price');
                        let price = 0;
                        if (priceEl) {
                            const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                            price = parseFloat(raw) || 0;
                        }

                        // Location is harder in this view, often textContent or specific class. 
                        // We can leave blank or try to parse text.
                        const location = '';

                        data.push({ external_id: id, title, price, url: fullUrl, location, district: '', neighborhood: '', seller_type: 'office', rooms: '', size_m2: 0 });
                    });
                    return data;
                }

                // Standard Search Mode Extraction
                const rows = document.querySelectorAll(selector);
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
                        if (parts.length >= 2) district = parts[1];
                        if (parts.length >= 3) {
                            let raw = parts[2];
                            raw = raw.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                            neighborhood = raw + ' Mah.';
                        }
                    }

                    const fullText = row.innerText + ' ' + title;
                    let size_m2 = 0;
                    const m2Match = fullText.match(/(\d+)\s*m[²2]/i);
                    if (m2Match) size_m2 = parseInt(m2Match[1]);

                    let rooms = '';
                    const roomsMatch = fullText.match(/(\d+\+\d+)|(Stüdyo)/i);
                    if (roomsMatch) rooms = roomsMatch[0].replace(/\s/g, '');

                    let seller_type = forcedType || 'office';
                    let seller_name = 'Bilinmiyor';

                    const lowerText = fullText.toLowerCase();
                    if (lowerText.includes('sahibinden') || lowerText.includes('bireysel')) {
                        seller_type = 'owner';
                        seller_name = 'Sahibinden';
                    } else if (lowerText.includes('banka')) {
                        seller_type = 'bank';
                        seller_name = 'Banka';
                    } else {
                        // Attempt to extract store name from search results
                        const storeEl = row.querySelector('.searchResultsStoreName') ||
                            row.querySelector('a.searchResultsStoreLabel') ||
                            row.querySelector('img[alt][title]');
                        if (storeEl) {
                            seller_name = storeEl.innerText?.trim() || storeEl.getAttribute('alt') || storeEl.getAttribute('title') || 'Kurumsal';
                        }
                    }

                    data.push({ external_id: id, title, price, url: fullUrl, location, district, neighborhood, seller_type, seller_name, rooms, size_m2 });
                });
                return data;
            }, forcedSellerType, selector);

            console.log(`🎉 Page ${pageNum + 1} extracted ${pageListings.length} listings.`);

            if (pageListings.length === 0) {
                hasNextPage = false;
            } else {
                console.log(`🎉 Page ${pageNum + 1} extracted ${pageListings.length} listings. Saving progress...`);

                // Enrich and Save progressively
                const enriched = pageListings.map(l => ({ ...l, category }));
                await saveListings(enriched);

                allListings = [...allListings, ...pageListings];
                pageNum++;
                // Save state progressively
                await saveBrowserState(page);

                if (pageNum < maxPages) {
                    await page.randomWait(3000, 6000);
                }
            }
        }

        return allListings;

    } catch (err) {
        if (err.message === '403_BLOCK_REBOOT') {
            console.log('🔄 Restarting scrape after profile reboot...');
            return await scrapeSahibindenStealth(url, forcedSellerType, category);
        }
        console.error('❌ Scrape Failed:', err.message);
        throw err;
    } finally {
        if (browser) await browser.disconnect();
    }
}

// Exported for backward compatibility but using new factory
async function getOrLaunchBrowser() {
    const { createStealthBrowser } = require('./browserFactory');
    const puppeteer = require('puppeteer-extra');
    const path = require('path');
    const fs = require('fs');

    try {
        // FAST path: Connect to existing debugger
        return await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    } catch (err) {
        console.log('⚠️ Existing Chrome 9222 not found. Launching optimized browser...');
        return await require('./browserFactory').createStealthBrowser({
            proxy: scraperConfig.stealth.useProxy ? scraperConfig.stealth.proxyUrl : null
        });
    }
}

async function rebootProfile() {
    console.log('🔄 DETECTED PERSISTENT BLOCK: Rebooting Profile...');
    const userDataDir = scraperConfig.paths.userDataDir;
    try {
        // We delete everything EXCEPT the cookies file to maintain some session if possible, 
        // but often Sahibinden blocks the profile fingerprint itself.
        if (fs.existsSync(userDataDir)) {
            const files = fs.readdirSync(userDataDir);
            for (const file of files) {
                if (file !== 'cookies.json') {
                    const fullPath = path.join(userDataDir, file);
                    if (fs.lstatSync(fullPath).isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(fullPath);
                    }
                }
            }
        }
    } catch (e) {
        console.error('⚠️ Profile reboot failed:', e.message);
    }
}

async function scrapeSahibindenDetails(url, existingPage = null) {
    console.log(`🔎 Scraping Sahibinden Details: ${url}`);
    let browser;
    let page;
    try {
        if (existingPage) {
            page = existingPage;
        } else {
            console.log('📄 Opening new detail tab (No existing page provided)');
            browser = await getOrLaunchBrowser();
            page = await browser.newPage();
            await humanizePage(page);
        }

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 403 Check and Reboot
        const title = await page.title();
        if (title.includes('Access Denied') || title.includes('Olağandışı')) {
            console.log('🛑 Forbidden/Access Denied detected in Detail Page!');
            await rebootProfile();
            throw new Error('403_BLOCK_REBOOT');
        }

        await checkBlock(page);

        // Human Jitter: Random mouse moves and hovers
        await page.mouseMoveOrganic('body');
        const hovers = await page.$$('.classifiedInfoList li');
        if (hovers.length > 0) {
            const randomLi = hovers[Math.floor(Math.random() * Math.min(hovers.length, 5))];
            const box = await randomLi.boundingBox();
            if (box) await page.mouseMoveOrganic(box.x + box.width / 2, box.y + box.height / 2);
        }

        // Random wait to simulate reading
        await page.randomWait(2000, 5000);

        // Wait for key elements
        try {
            await page.waitForSelector('.classifiedInfo', { timeout: 5000 });
        } catch (e) { }

        const data = await page.evaluate(() => {
            const description = document.querySelector('#classifiedDescription')?.innerText.trim() || '';

            // Images
            const images = [];
            document.querySelectorAll('.classifiedDetailMainPhoto img').forEach(img => images.push(img.src));
            document.querySelectorAll('.megaPhoto img').forEach(img => images.push(img.getAttribute('data-source') || img.src));

            // Features
            const features = [];
            document.querySelectorAll('.uiBox.selected').forEach(li => features.push(li.innerText.trim()));

            // Extract Attributes
            const infoMap = {};
            document.querySelectorAll('.classifiedInfoList li').forEach(li => {
                const label = li.querySelector('strong')?.innerText.trim();
                const value = li.querySelector('span')?.innerText.trim();
                if (label && value) infoMap[label] = value;
            });

            // Seller Info
            const seller_name = document.querySelector('.username-info-area h5')?.innerText.trim() ||
                document.querySelector('.user-info-module .u-name')?.innerText.trim() ||
                'Dosya Sahibi';

            const seller_phone = document.querySelector('.pretty-phone-part')?.innerText.trim() || '';

            return {
                description,
                images: [...new Set(images)],
                features,
                size_m2: parseInt(infoMap['m² (Brüt)'] || 0),
                rooms: infoMap['Oda Sayısı'] || null,
                heating_type: infoMap['Isıtma'] || null,
                building_age: infoMap['Bina Yaşı'] || null,
                floor_location: infoMap['Bulunduğu Kat'] || null,
                seller_name,
                seller_phone
            };
        });

        // Clean up data
        if (data.images.length === 0) {
            // Fallback for single image
            const mainImg = await page.$eval('.classifiedDetailMainPhoto img', img => img.src).catch(() => null);
            if (mainImg) data.images.push(mainImg);
        }

        return data;

    } catch (error) {
        if (error.message === '403_BLOCK_REBOOT') {
            console.log('🔄 Restarting detail scrape after profile reboot...');
            return await scrapeSahibindenDetails(url);
        }
        console.error('❌ Detail Scrape Failed:', error.message);
        throw error;
    } finally {
        // Only close if we opened it and it's not the reusing logic
        if (!existingPage && browser && (await browser.pages()).length > 2) {
            const pages = await browser.pages();
            await pages[pages.length - 1].close();
        }
    }
}

module.exports = { scrapeSahibindenStealth, getOrLaunchBrowser, scrapeSahibindenDetails };
