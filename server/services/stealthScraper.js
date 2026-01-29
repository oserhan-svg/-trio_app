const { createStealthBrowser, saveBrowserState, humanizePage } = require('./browserFactory');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');
const { getSessionManager } = require('./sessionManager');
const { generatePropertyTitle } = require('../scripts/fix_nameless_titles');

/**
 * Checks for known blocking pages/titles
 */
const { handleCloudflareChallenge } = require('./cloudflareBypass');

/**
 * Checks for known blocking pages/titles and auto-solves them
 */
async function checkBlock(page) {
    try {
        const title = await page.title();
        const content = await page.evaluate(() => document.body.innerText).catch(() => '');

        const isBlocked = scraperConfig.selectors.blockIndicators.some(indicator =>
            title.includes(indicator) || content.includes(indicator)
        );

        if (isBlocked) {
            console.log('🛑 DETECTED BLOCK! Initiating Smart Bypass...');
            const sessionMgr = getSessionManager();
            sessionMgr.addEvent('Sahibinden: Blok tespiti! Otomatik çözüm deneniyor...', 'warning', 'sahibinden');

            // Attempt Auto-Solve using our enhanced module
            const result = await handleCloudflareChallenge(page, {
                maxAutoWait: 60000,
                enableManualFallback: true // Allow manual if auto fails
            });

            if (result.success) {
                console.log('✅ Block cleared via ' + result.method + '! Resuming...');
                sessionMgr.addEvent('Sahibinden: Engel aşıldı (' + result.method + '), devam ediliyor.', 'success', 'sahibinden');

                // CRITICAL: Save the new "trusted" state immediately
                await saveBrowserState(page);
                await new Promise(r => setTimeout(r, 2000));

            } else {
                console.error('❌ Bypass failed. Manual intervention required.');
                // The handleCloudflareChallenge function already did the waiting/logging
            }
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
        const sessionManager = getSessionManager();
        sessionManager.addEvent(`Yan aktivite yapılıyor: ${target}`, 'info');
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

async function scrapeSahibindenStealth(url, forcedSellerType = null, category = 'residential', targetPages = [1, 2], injectedPage = null, listingType = 'sale') {
    const { saveListings } = require('./scraperService');
    const sessionManager = getSessionManager();

    // Performance tracking
    const perfStart = Date.now();
    console.log(`🕵️ Stealth Scraper Starting for: ${url} [Type: ${listingType}, Category: ${category}, Pages: ${targetPages.join(', ')}]`);
    sessionManager.addEvent(`Sahibinden: Tarama başlatıldı [${listingType} - ${category}]`, 'info', 'sahibinden');

    let browser;
    try {
        let page;
        if (injectedPage) {
            console.log('ℹ️ Using Injected Browser Page (Interactive Mode)');
            page = injectedPage;
            browser = page.browser();
            await humanizePage(page);
            // Don't close injected browser
        } else {
            browser = await getOrLaunchBrowser();
            if (!browser) throw new Error('Browser initialization failed.');

            const pages = await browser.pages();
            page = pages.find(p => p.url().includes('sahibinden.com'));

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
        }

        let allListings = [];

        for (const pageNum1Based of targetPages) {
            const pageNum = pageNum1Based - 1; // 0-based for offset
            const pageSize = scraperConfig.pagination?.sahibinden || 20;
            const offset = pageNum * pageSize;
            const pageUrl = url.includes('?')
                ? `${url}&pagingOffset=${offset}&pagingSize=${pageSize}`
                : `${url}?pagingOffset=${offset}&pagingSize=${pageSize}`;
            console.log(`📍 Page ${pageNum1Based}: Visiting ${pageUrl} (Offset: ${offset}, Size: ${pageSize})`);
            sessionManager.addEvent(`Sahibinden: Sayfa ${pageNum1Based} ziyaret ediliyor (Size: ${pageSize})...`, 'info', 'sahibinden');

            // Navigate with random delay
            if (page.url() !== pageUrl) {
                // Before navigating, move mouse randomly
                await page.mouseMoveOrganic('body');
                await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });

                // Wait after navigation completes (more human-like)
                await page.randomWait(scraperConfig.timeouts.afterNavigationDelay || 3000, (scraperConfig.timeouts.afterNavigationDelay || 3000) + 2000);
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

            // Occasionally perform side-quest to stay "human" (optimized frequency)
            const sideQuestFreq = scraperConfig.timeouts.sideQuestFrequency || 5;
            if (pageNum > 0 && pageNum % sideQuestFreq === 0) {
                await performSideQuest(page);
                // Return to original target
                console.log('🏡 Returning to target page...');
                await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });

                // Check for blocks after side-quest return
                try {
                    const title = await page.title();
                    if (title.includes('Access Denied') || title.includes('Olağandışı')) {
                        console.log('🛑 Forbidden detected after Side Quest!');
                        await rebootProfile();
                        throw new Error('403_BLOCK_REBOOT');
                    }
                    await checkBlock(page);
                } catch (e) {
                    if (e.message === '403_BLOCK_REBOOT') throw e;
                }

                await page.randomWait(2000, 4000);
            }

            // Random scroll to simulate browsing
            await page.randomScroll();

            // Random mouse jitter near some elements
            await page.mouseMoveOrganic('.searchResultsItem');

            const selector = scraperConfig.selectors.listingRow || '.searchResultsItem';

            // Wait for table or list items with retry logic
            let listingsFound = false;
            for (let attempt = 0; attempt <= (scraperConfig.retry?.maxPageRetries || 0); attempt++) {
                try {
                    if (attempt > 0) {
                        console.log(`🔄 Retry attempt ${attempt}/${scraperConfig.retry?.maxPageRetries || 0} for page ${pageNum1Based}...`);
                        sessionManager.addEvent(`Sayfa ${pageNum1Based} tekrar deneniyor (${attempt}/${scraperConfig.retry?.maxPageRetries || 0})`, 'warning', 'sahibinden');
                        // Exponential backoff: 3s, 6s, 12s, etc.
                        const baseDelay = scraperConfig.timeouts.retryDelay || 3000;
                        const backoffDelay = scraperConfig.retry?.useExponentialBackoff
                            ? baseDelay * Math.pow(2, attempt - 1)
                            : baseDelay;
                        await page.randomWait(backoffDelay, backoffDelay + 2000);
                        // Try reloading the page
                        await page.reload({ waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });
                    }

                    await page.waitForFunction(() =>
                        document.querySelectorAll('.searchResultsItem').length > 0 ||
                        document.querySelectorAll('.classified:not(.header)').length > 0
                        , { timeout: scraperConfig.timeouts.element });

                    listingsFound = true;
                    break;
                } catch (e) {
                    if (attempt >= (scraperConfig.retry?.maxPageRetries || 0)) {
                        console.log(`❌ Listings not found on page ${pageNum1Based} after ${attempt} retries. ${scraperConfig.retry?.continueOnPageFailure ? 'Skipping to next page...' : 'Ending pagination.'}`);
                        sessionManager.addEvent(`Sayfa ${pageNum1Based} başarısız oldu, ${scraperConfig.retry?.continueOnPageFailure ? 'devam ediliyor' : 'sonlandırılıyor'}.`, 'error', 'sahibinden');
                    }
                }
            }

            if (!listingsFound) {
                if (scraperConfig.retry?.continueOnPageFailure) {
                    continue; // Skip to next page
                } else {
                    break; // End pagination
                }
            }

            // Extract Data
            const pageListings = await page.evaluate((forcedType, selector, lType) => {
                // Check if we are in Store Mode (div.classified)
                const storeItems = document.querySelectorAll('.classified:not(.header)');
                if (storeItems.length > 0) {
                    // Store Mode Extraction
                    const data = [];
                    storeItems.forEach(row => {
                        const titleEl = row.querySelector('.info .title a') || row.querySelector('.image a img');
                        const title = titleEl ? (titleEl.getAttribute('alt') || titleEl.innerText.trim()) : 'No Title';
                        const urlEl = row.querySelector('.info .title a') || row.querySelector('.image a');
                        if (!urlEl) return;

                        const fullUrl = urlEl.href;
                        const idMatch = fullUrl.match(/-(\d+)\/detay/);
                        const id = idMatch ? idMatch[1] : null;

                        const priceEl = row.querySelector('.price');
                        let price = 0;
                        if (priceEl) {
                            const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                            price = parseFloat(raw) || 0;
                        }

                        // Location is harder in this view, often textContent or specific class. 
                        // We can leave blank or try to parse text.
                        const location = '';

                        // Try to extract consultant name from listing card (if available in store view)
                        // In some store themes, it's in a specific class or title
                        const consultantEl = row.querySelector('.consultantName') || row.querySelector('.real-estate-consultant');
                        let seller_name = consultantEl ? consultantEl.innerText.trim() : '';

                        // If empty, it might be the store owner (Admin) which we handle later via fallback.
                        // But let's leave it empty to trigger "Bilinmiyor" or fallback logic.

                        // Store mode: listing date extraction
                        let listing_date = null;
                        const dateEl = row.querySelector('.date') || row.querySelector('.classified-date') || row.querySelector('[class*="date"]');
                        if (dateEl) {
                            listing_date = dateEl.innerText.trim();
                        }

                        // Determine listing type from URL or fallback to passed lType
                        const typeFromUrl = fullUrl.includes('kiralik') ? 'rent' : (fullUrl.includes('satilik') ? 'sale' : lType);

                        data.push({
                            external_id: id,
                            title,
                            price,
                            url: fullUrl,
                            location,
                            district: '',
                            neighborhood: '',
                            seller_type: 'office',
                            seller_name,
                            rooms: '',
                            size_m2: 0,
                            listing_date,
                            listing_type: typeFromUrl
                        });
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

                    // STRICT GEOGRAPHY FILTER: Ensure we only get Ayvalık listings
                    // This prevents "Similar Listings" from other cities (e.g. Afyon) or Search mishaps
                    const isAyvalik = location && (location.toLocaleLowerCase('tr-TR').includes('ayvalık') || location.toLowerCase().includes('ayvalik'));

                    if (!isAyvalik) {
                        return;
                    }

                    let district = '';
                    let neighborhood = '';

                    if (location) {
                        // Fix for missing location: Split by newline OR slash
                        // Example: "Balıkesir \n Ayvalık \n Cunda" OR "Balıkesir / Ayvalık / Cunda"
                        const parts = location.split(/[\/\n\r]+/).map(s => s.trim()).filter(s => s.length > 0);

                        if (parts.length >= 3) {
                            district = parts[1];
                            let raw = parts[2];
                            raw = raw.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                            neighborhood = raw + ' Mah.';
                        } else if (parts.length === 2) {
                            // Case: "Küçükköy \n Küçükköy Mh." (City omitted)
                            district = parts[0];
                            let raw = parts[1];
                            raw = raw.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                            neighborhood = raw + ' Mah.';
                        } else if (parts.length === 1) {
                            district = parts[0]; // Best guess
                        }
                    }

                    const fullText = row.innerText + ' ' + title;
                    const lowerText = fullText.toLowerCase();
                    let seller_type = forcedType || 'office';
                    let seller_name = 'Bilinmiyor';
                    let size_m2 = 0;
                    const m2Match = fullText.match(/(\d+)\s*m[²2]/i);
                    if (m2Match) size_m2 = parseInt(m2Match[1]);

                    let rooms = '';
                    const roomsMatch = fullText.match(/(\d+\+\d+)|(Stüdyo)/i);
                    if (roomsMatch) rooms = roomsMatch[0].replace(/\s/g, '');

                    if (forcedType === 'owner') {
                        seller_name = 'Sahibinden';
                        seller_type = 'owner';
                    } else if (lowerText.includes('sahibinden') ||
                        lowerText.includes('bireysel') ||
                        lowerText.includes('kişisel') ||
                        lowerText.includes('owner') ||
                        row.querySelector('.searchResultsTitleValue .text-glow') ||
                        row.querySelector('a[href*="/sahibinden"]')) {
                        seller_type = 'owner';
                        seller_name = 'Sahibinden (Bireysel)';
                    } else if (lowerText.includes('banka')) {
                        seller_type = 'bank';
                        seller_name = 'Banka';
                    } else {
                        // Attempt to extract store name from search results
                        const storeEl = row.querySelector('.searchResultsStoreName') ||
                            row.querySelector('a.searchResultsStoreLabel') ||
                            row.querySelector('span[class*="store"]');

                        if (storeEl) {
                            // Sometimes the name is in the title attribute if text is truncated
                            seller_name = storeEl.innerText?.trim() || storeEl.getAttribute('title') || 'Kurumsal';
                        }
                    }

                    // Listing Date Extraction with multiple fallback selectors
                    let listing_date = null;
                    const dateEl = row.querySelector('.searchResultsDateValue') ||
                        row.querySelector('.classified-info-date') ||
                        row.querySelector('[class*="Date"]') ||
                        row.querySelector('.date-info');

                    if (dateEl) {
                        const rawDate = dateEl.innerText.trim();
                        // Parse Turkish relative dates
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                        const monthMap = {
                            'ocak': '01', 'şubat': '02', 'mart': '03', 'nisan': '04',
                            'mayıs': '05', 'haziran': '06', 'temmuz': '07', 'ağustos': '08',
                            'eylül': '09', 'ekim': '10', 'kasım': '11', 'aralık': '12'
                        };

                        if (rawDate.toLowerCase().includes('bugün') || rawDate.toLowerCase().includes('today')) {
                            listing_date = today.toISOString().split('T')[0];
                        } else if (rawDate.toLowerCase().includes('dün') || rawDate.toLowerCase().includes('yesterday')) {
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            listing_date = yesterday.toISOString().split('T')[0];
                        } else if (rawDate.match(/(\d+)\s*(saat|hour)/i)) {
                            listing_date = today.toISOString().split('T')[0];
                        } else if (rawDate.match(/(\d+)\s*(gün|day)/i)) {
                            const match = rawDate.match(/(\d+)\s*(gün|day)/i);
                            const daysAgo = parseInt(match[1]);
                            const date = new Date(today);
                            date.setDate(date.getDate() - daysAgo);
                            listing_date = date.toISOString().split('T')[0];
                        } else if (rawDate.match(/\d{2}\.\d{2}\.\d{4}/)) {
                            const parts = rawDate.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                            if (parts) listing_date = `${parts[3]}-${parts[2]}-${parts[1]}`;
                        } else {
                            // Handle "25 Ocak 2026" or "25 Ocak"
                            const parts = rawDate.split(/\s+/);
                            if (parts.length >= 2) {
                                const day = parts[0].padStart(2, '0');
                                const monthName = parts[1].toLocaleLowerCase('tr-TR');
                                const month = monthMap[monthName];
                                const year = parts[2] || now.getFullYear();

                                if (day && month && year) {
                                    listing_date = `${year}-${month}-${day}`;
                                }
                            }
                        }

                        // Final safety: ensure it's a valid date string or null
                        if (listing_date && isNaN(new Date(listing_date).getTime())) {
                            console.log(`⚠️ Invalid date parsed: [${rawDate}] -> ${listing_date}. Nullifying.`);
                            listing_date = null;
                        }
                    }

                    // Determine listing type from URL or fallback to passed lType
                    const typeFromUrl = fullUrl.includes('kiralik') ? 'rent' : (fullUrl.includes('satilik') ? 'sale' : lType);

                    data.push({
                        external_id: id,
                        title,
                        price,
                        url: fullUrl,
                        location,
                        district,
                        neighborhood,
                        seller_type,
                        seller_name,
                        rooms,
                        size_m2,
                        listing_date,
                        listing_type: typeFromUrl
                    });
                });
                return data;
            }, forcedSellerType, selector, listingType);

            console.log(`🎉 Page ${pageNum + 1} extracted ${pageListings.length} listings.`);

            if (pageListings.length === 0) {
                console.log(`ℹ️ Page ${pageNum + 1} returned no listings. Ending pagination.`);
                break;
            } else {
                console.log(`🎉 Page ${pageNum + 1} extracted ${pageListings.length} listings. Saving progress...`);

                // Enrich and Save progressively
                const enriched = pageListings.map(l => {
                    const item = { ...l, category };
                    if (!item.title || item.title === 'No Title' || item.title === 'İsimsiz İlan') {
                        item.title = generatePropertyTitle(item);
                    }
                    return item;
                });
                const { getSessionManager } = require('./sessionManager');
                const sessionManager = getSessionManager();
                sessionManager.trackRequest(true, 'sahibinden');
                sessionManager.trackListings('sahibinden', pageListings.length);
                sessionManager.addEvent(`Sahibinden: Sayfa ${pageNum1Based} tarandı, ${pageListings.length} ilan alındı.`, 'info', 'sahibinden');
                await saveListings(enriched);

                allListings = [...allListings, ...pageListings];

                // Save state progressively
                await saveBrowserState(page);

                if (targetPages.indexOf(pageNum1Based) < targetPages.length - 1) {
                    await page.randomWait(3000, 6000);
                }
            }
        }

        // Performance summary
        const perfEnd = Date.now();
        const totalSeconds = (perfEnd - perfStart) / 1000;
        const lpm = totalSeconds > 0 ? (allListings.length / totalSeconds * 60).toFixed(2) : 0;
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📊 SCRAPING PERFORMANCE SUMMARY [${category}]`);
        console.log(`   Duration: ${totalSeconds.toFixed(1)}s (${(totalSeconds / 60).toFixed(2)} minutes)`);
        console.log(`   Pages Scraped: ${targetPages.length}`);
        console.log(`   Listings Found: ${allListings.length}`);
        console.log(`   Listings/Minute (LPM): ${lpm}`);
        console.log(`${'='.repeat(70)}\n`);
        sessionManager.addEvent(`Sahibinden: Tarama tamamlandı. ${allListings.length} ilan, ${totalSeconds.toFixed(1)}s`, 'success', 'sahibinden');

        return allListings;

    } catch (err) {
        if (err.message === '403_BLOCK_REBOOT') {
            console.log('🔄 Restarting scrape after profile reboot...');
            return await scrapeSahibindenStealth(url, forcedSellerType, category, targetPages, injectedPage);
        }
        console.error('❌ Scrape Failed:', err.message);
        throw err;
    } finally {
        // Only disconnect if we are NOT using an injected page (interactive mode)
        // In interactive mode, the main loop manages the browser lifecycle.
        if (browser && !injectedPage) {
            await browser.disconnect();
        }
    }
}

// Exported for backward compatibility but using new factory
async function getOrLaunchBrowser() {
    const { createStealthBrowser } = require('./browserFactory');
    const puppeteer = require('puppeteer-extra');
    const path = require('path');
    const fs = require('fs');
    const os = require('os');

    try {
        // FAST path: Connect to existing debugger
        return await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    } catch (err) {
        console.log('⚠️ Existing Chrome 9222 not found/connect failed:', err.message);

        try {
            console.log('🚀 Launching fresh optimized browser (Default Profile)...');
            return await require('./browserFactory').createStealthBrowser({
                proxy: scraperConfig.stealth.useProxy ? scraperConfig.stealth.proxyUrl : null
            });
        } catch (launchErr) {
            // Check for profile lock error
            if (launchErr.message && (launchErr.message.includes('already running') || launchErr.message.includes('EBUSY') || launchErr.message.includes('locked'))) {
                console.log('🔒 Default profile is LOCKED. Launching with TEMPORARY profile for this scrape...');

                const tempDir = path.join(os.tmpdir(), `emlak22-temp-${Date.now()}`);

                // Copy cookies if possible to preserve some session?
                // It might risk locking if we copy to a locked dir, but we are writing TO temp.
                // Reading from the main cookie file should be safe (read-only).

                return await require('./browserFactory').createStealthBrowser({
                    proxy: scraperConfig.stealth.useProxy ? scraperConfig.stealth.proxyUrl : null,
                    userDataDir: tempDir
                });
            }
            throw launchErr;
        }
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
            // CHECK FOR REMOVED LISTING INDICATORS
            const bodyText = document.body.innerText;
            const removedMsg = document.querySelector('.classified-expired-status') ||
                document.querySelector('.classified-not-active') ||
                bodyText.includes('Bu ilan yayında değildir') ||
                bodyText.includes('İlan yayında değil');

            if (removedMsg) {
                return { isRemoved: true };
            }

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
            // Seller Info - Robust Extraction for Consultant
            let seller_name = 'Dosya Sahibi';

            // 1. Try Specific Consultant Selectors
            const consultantEl = document.querySelector('.user-info-agent h3') || // Verified with debug
                document.querySelector('.sticky-header-name') || // Sticky header fallback
                document.querySelector('.user-info-agent .name') ||
                document.querySelector('.consultant-name') ||
                document.querySelector('.real-estate-consultant');

            if (consultantEl) {
                seller_name = consultantEl.innerText.trim();
            } else {
                // 2. Fallback to generic user info, but filtered
                const genericEl = document.querySelector('.username-info-area h5') ||
                    document.querySelector('.user-info-module .u-name');

                if (genericEl) {
                    const text = genericEl.innerText.trim();
                    // If it looks like an agency name, try to find a sub-name
                    if (text.toLowerCase().includes('emlak') || text.toLowerCase().includes('gayrimenkul')) {
                        // Look for a secondary name below it
                        const subName = document.querySelector('.username-info-area .title')?.innerText.trim();
                        if (subName && subName.length > 2) {
                            seller_name = subName;
                        } else {
                            seller_name = text; // Default to agency if no person found
                        }
                    } else {
                        seller_name = text;
                    }
                }
            }

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

        if (data.isRemoved) {
            console.log(`⚠️ Listing REMOVED detected (Sahibinden): ${url}`);
            const error = new Error('ListingRemoved');
            error.code = 'LISTING_REMOVED';
            throw error;
        }

        return data;

    } catch (error) {
        if (error.message === '403_BLOCK_REBOOT') {
            if (existingPage) {
                console.log('🛑 Forbidden detected in Shared Browser Mode. Skipping reboot/retry to preserve session.');
                throw new Error('BLOCKED_IN_SHARED_MODE');
            }
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



async function scrapeSahibindenTeam(url, existingPage = null) {
    console.log(`👥 Scraping Team Page: ${url}`);
    let browser, page;
    try {
        if (existingPage) {
            page = existingPage;
        } else {
            browser = await getOrLaunchBrowser();
            page = await browser.newPage();
            await humanizePage(page);
        }

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // await checkBlock(page); // Skip block check on attached page for now to be safe
        // await page.mouseMoveOrganic('body'); // Removed to prevent crash

        // Wait for team list
        try {
            await page.waitForSelector('.some-team-selector-or-body', { timeout: 5000 });
        } catch (e) { }

        const teamMembers = await page.evaluate(() => {
            const members = [];

            // Verified Strategy: Store Facelift "Ekibimiz" structure
            const userCards = document.querySelectorAll('.consultants-list .consultant');

            userCards.forEach(card => {
                const nameEl = card.querySelector('.info .name');
                const phoneEl = card.querySelector('.contact-info .phone');
                const imgEl = card.querySelector('.photo img');

                const name = nameEl ? nameEl.innerText.trim() : '';
                // Prefer data-phone attribute if available, else text
                const phone = phoneEl ? (phoneEl.getAttribute('data-phone') || phoneEl.innerText.trim()) : '';
                const img = imgEl ? imgEl.src : '';

                if (name) {
                    members.push({ name, phone, img });
                }
            });

            return members;
        });

        console.log(`👥 Found ${teamMembers.length} team members.`);
        return teamMembers;

    } catch (e) {
        console.error('❌ Team Scrape Failed:', e.message);
        return [];
    } finally {
        if (!existingPage && browser) await browser.close();
    }
}

async function findComparableListings(criteria) {
    console.log('🕵️ Finding comparables for:', criteria);
    // criteria: { district, price_min, price_max, rooms }

    // Construct Search URL dynamically (Reverse-engineered Sahibinden URL structure)
    // Base: https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-{district}?price_min={min}&price_max={max}

    let districtSlug = criteria.district ? criteria.district.toLowerCase().replace(/ /g, '-').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g') : '';
    if (districtSlug && !districtSlug.includes('mah')) districtSlug += '-mahallesi';

    let searchUrl = `https://www.sahibinden.com/satilik/balikesir-ayvalik${districtSlug ? '-' + districtSlug : ''}?`;

    if (criteria.price_min) searchUrl += `&price_min=${criteria.price_min}`;
    if (criteria.price_max) searchUrl += `&price_max=${criteria.price_max}`;
    if (criteria.rooms) {
        // Simple mapping for demonstration. Real mapping requires exact query params.
        // For now, we search broad and filter in memory if strict.
    }

    searchUrl += '&sorting=price_asc'; // Find cheapest for arbitrage

    console.log('🔎 Generated Search URL:', searchUrl);

    try {
        const listings = await scrapeSahibindenStealth(searchUrl, null, 'residential', [1]);
        return listings;
    } catch (e) {
        console.error('Comparable search failed:', e);
        return [];
    }
}

function detectArbitrage(targetProperty, comparables) {
    if (!comparables || comparables.length === 0) return null;

    // Filter outliers (very cheap or very expensive)
    const validComps = comparables.filter(c => c.price > 0 && c.price !== targetProperty.price);

    if (validComps.length === 0) return null;

    // Calculate Average Market Price
    const total = validComps.reduce((sum, c) => sum + c.price, 0);
    const averagePrice = total / validComps.length;

    const diff = targetProperty.price - averagePrice;
    const percentageDiff = (diff / averagePrice) * 100;

    // Arbitrage Logic
    // If our property is 10% cheaper than average -> Opportunity
    // If our property is 10% more expensive -> Overpriced
    let status = 'Fair Market Value';
    if (percentageDiff < -10) status = 'Under Market Value (Opportunity)';
    if (percentageDiff > 10) status = 'Overpriced';

    return {
        targetPrice: targetProperty.price,
        marketAverage: averagePrice,
        percentageDiff: percentageDiff.toFixed(2),
        status,
        comparableCount: validComps.length,
        cheapestComp: validComps.sort((a, b) => a.price - b.price)[0]
    };
}

module.exports = { scrapeSahibindenStealth, getOrLaunchBrowser, scrapeSahibindenDetails, scrapeSahibindenTeam, findComparableListings, detectArbitrage };
