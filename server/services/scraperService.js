const puppeteer = require('puppeteer-extra');
const { createStealthBrowser, configureStealthPage, humanizePage, saveBrowserState } = require('./browserFactory');
const cron = require('node-cron');
const prisma = require('../db');

// ... (keep normalizeNeighborhood)

const normalizeNeighborhood = (name) => {
    if (!name) return '';
    let clean = name.trim();
    clean = clean.replace(/\s+Mahallesi/i, '')
        .replace(/\s+Mah\.?/i, '')
        .replace(/\s+Mh\.?/i, '')
        .trim();
    return clean + ' Mah.';
};
const { sendNewListingNotification } = require('./notificationService');
const { findMatchesForProperty } = require('./matchingService');
const { checkOpportunity } = require('./analyticsService');

// URLs Configuration
const CATEGORIES = [
    {
        name: 'Satılık Daire',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/daire',
        sahibinden: 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-daire/balikesir-ayvalik/',
        type: 'sale',
        category: 'daire'
    },
    {
        name: 'Satılık Villa',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/villa',
        sahibinden: 'https://www.sahibinden.com/satilik-villa/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-villa/balikesir-ayvalik/',
        type: 'sale',
        category: 'villa'
    },
    {
        name: 'Satılık Müstakil Ev',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/mustakil-ev',
        sahibinden: 'https://www.sahibinden.com/satilik-mustakil-ev/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-mustakil-ev/balikesir-ayvalik/',
        type: 'sale',
        category: 'mustakil'
    },
    {
        name: 'Kiralık Daire',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-kiralik/daire',
        sahibinden: 'https://www.sahibinden.com/kiralik-daire/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/kiralik-daire/balikesir-ayvalik/',
        type: 'rent',
        category: 'daire'
    },
    {
        name: 'Satılık Arsa',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik-arsa',
        sahibinden: 'https://www.sahibinden.com/satilik-arsa/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-arsa/balikesir-ayvalik/',
        type: 'sale',
        category: 'land'
    },
    {
        name: 'Satılık İşyeri',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik-isyeri',
        sahibinden: 'https://www.sahibinden.com/satilik-is-yeri/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-isyeri/balikesir-ayvalik/',
        type: 'sale',
        category: 'commercial'
    }
];

async function scrapeProperties(provider = 'all') {
    console.log(`Starting scrape job for: ${provider}`);

    let browser;
    try {
        const { getOrLaunchBrowser } = require('./stealthScraper');
        browser = await getOrLaunchBrowser();
    } catch (err) {
        console.error('CRITICAL: Could not launch browser.', err);
        return;
    }

    if (!browser) return;

    try {
        const page = await browser.newPage();
        await configureStealthPage(page);
        await humanizePage(page);

        if (provider === 'all' || provider === 'hepsiemlak') {
            for (const cat of CATEGORIES) {
                console.log(`Targeting Hepsiemlak Category: ${cat.name}`);
                await scrapeHepsiemlak(page, cat.hepsiemlak, null, cat.category);

                if (cat.type === 'sale') {
                    const ownerUrl = cat.hepsiemlak.replace('satilik', 'satilik-sahibinden');
                    console.log(`Targeting Hepsiemlak (Owner Tab): ${ownerUrl}`);
                    await scrapeHepsiemlak(page, ownerUrl, 'owner', cat.category);
                }
                await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
            }
        }

        if (provider === 'all' || provider === 'emlakjet') {
            for (const cat of CATEGORIES) {
                console.log(`Targeting Emlakjet Category: ${cat.name}`);
                await scrapeEmlakjet(page, cat.emlakjet, cat.category);
                await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
            }
        }

        if (provider === 'all' || provider === 'sahibinden') {
            for (const cat of CATEGORIES) {
                console.log(`Targeting Sahibinden Category: ${cat.name}`);
                const { scrapeSahibindenStealth } = require('./stealthScraper');
                await scrapeSahibindenStealth(cat.sahibinden, null, cat.category);
                await new Promise(r => setTimeout(r, 10000 + Math.random() * 10000));
            }
        }
    } catch (error) {
        console.error('Global Scraper Error:', error);
    } finally {
        if (browser) {
            console.log('Disconnecting from browser...');
            await browser.disconnect();
        }
    }
}

async function solveCloudflareChallenge(page) {
    try {
        console.log('🛡️ Attempting to solve Cloudflare challenge (Hybrid Scan + Wait + Visual)...');

        // 0. Explicitly wait for the challenge iframe
        let iframeFound = false;
        try {
            await page.waitForSelector('iframe[src*="cloudflare-if/"]', { timeout: 6000 });
            iframeFound = true;
        } catch (e) {
            try {
                await page.waitForSelector('iframe[src*="challenges"]', { timeout: 4000 });
                iframeFound = true;
            } catch (e2) { }
        }

        console.log(`🛡️ Iframe Wait Result: ${iframeFound ? 'Found' : 'Not Found (Main Frame Only)'}`);
        await new Promise(r => setTimeout(r, 2000));

        let solved = false;

        // 1. Scan frames (if any)
        const frames = page.frames();
        console.log(`🛡️ Scanning ${frames.length} frames for Turnstile...`);

        for (const frame of frames) {
            try {
                // Run Shadow DOM search INSIDE each frame
                const foundInFrame = await frame.evaluate(() => {
                    const findShadowElement = (selector, root = document) => {
                        const element = root.querySelector(selector);
                        if (element) return element;
                        const walkers = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
                        while (walkers.nextNode()) {
                            const node = walkers.currentNode;
                            if (node.shadowRoot) {
                                const found = findShadowElement(selector, node.shadowRoot);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    const target = findShadowElement('input[type="checkbox"]') || findShadowElement('.ctp-checkbox-label');
                    if (target) { target.click(); return true; }
                    return false;
                });

                if (foundInFrame) {
                    console.log(`🛡️ Found & Clicked Turnstile in frame: ${frame.url()}`);
                    solved = true;
                    break;
                }
            } catch (e) { }
        }

        // 2. Fallback: Text-Based Coordinate Click (Main Frame)
        if (!solved) {
            console.log('🛡️ Semantic click failed. Trying Text-Coordinate Fallback...');
            try {
                // Find "Verify you are human" or "Doğrulanıyor" text
                let retries = 0;
                let textFoundCords = null;
                // Increased to 30 retries (approx 15 seconds)
                while (!textFoundCords && retries < 30) {
                    textFoundCords = await page.evaluate(() => {
                        const allElements = document.querySelectorAll('*');
                        for (const el of allElements) {
                            if (el.innerText) {
                                const text = el.innerText.toLowerCase();
                                if (text.includes('verify you are human') || text.includes('human') || text.includes('doğrulanıyor') || text.includes('doğrulama') || text.includes('devam etmek')) {
                                    const rect = el.getBoundingClientRect();
                                    if (rect.width > 0 && rect.height > 0) {
                                        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
                                    }
                                }
                            }
                        }
                        return null;
                    });
                    if (!textFoundCords) {
                        if (retries % 5 === 0) console.log(`🛡️ Text scan attempt ${retries + 1}/30...`);
                        await new Promise(r => setTimeout(r, 500));
                        retries++;
                    }
                }

                if (textFoundCords) {
                    console.log('🛡️ Clicked "Verify" text.');
                    // Click text to focus
                    await page.mouse.click(textFoundCords.x + textFoundCords.w / 2, textFoundCords.y + textFoundCords.h / 2);
                    await new Promise(r => setTimeout(r, 500));

                    // Click just to the left of the text (common layout)
                    console.log('🛡️ Clicked Left of "Verify" text.');
                    await page.mouse.click(textFoundCords.x - 30, textFoundCords.y + textFoundCords.h / 2);
                    solved = true;
                } else {
                    // 3. Fallback: Click Center of Screen (Standard Cloudflare location)
                    const viewport = page.viewport();
                    if (viewport) {
                        console.log('🛡️ Text not found. Clicking Center of Screen...');
                        await page.mouse.click(viewport.width / 2, viewport.height / 2);
                        solved = true;
                    }
                }
            } catch (e) {
                console.log('Visual fallback error:', e.message);
            }
        }

        // 4. Fallback: Blind Keyboard Interaction
        if (!solved) {
            console.log('🛡️ Trying Keyboard Fallback (Tab+Space)...');
            try {
                await page.click('body').catch(() => { });
                await new Promise(r => setTimeout(r, 500));
                for (let i = 0; i < 3; i++) {
                    await page.keyboard.press('Tab');
                    await new Promise(r => setTimeout(r, 300));
                }
                await page.keyboard.press('Space');
                console.log('🛡️ Sent Blind Keypress.');
            } catch (e) { }
        }

        console.log('🛡️ Interaction attempted. Waiting for reload...');
        await new Promise(r => setTimeout(r, 8000));

    } catch (e) {
        console.log('Error solving Cloudflare:', e.message);
    }
}

async function scrapeHepsiemlak(page, url, forcedSellerType = null, category = 'residential') {
    console.log(`--- Scraping Hepsiemlak (${url}) [Forced Type: ${forcedSellerType || 'Auto'}, Category: ${category}] ---`);
    let allListings = [];
    let pageNum = 1;
    let hasNextPage = true;

    while (hasNextPage && pageNum <= 5) {
        const pageUrl = `${url}?page=${pageNum}`;
        console.log(`Navigating to Hepsiemlak Page ${pageNum}: ${pageUrl}`);

        let retryCount = 0;
        const maxRetries = 2;
        let pageSuccess = false;

        while (retryCount <= maxRetries && !pageSuccess) {
            try {
                if (retryCount > 0) {
                    console.log(`🔄 Retrying page ${pageNum} (Attempt ${retryCount + 1})...`);
                    await page.reload({ waitUntil: 'domcontentloaded' });
                } else {
                    await page.goto(pageUrl, {
                        waitUntil: pageNum === 1 ? 'networkidle2' : 'domcontentloaded',
                        timeout: 45000
                    });
                }

                // Cloudflare / Bot Protection Check
                try {
                    const pageTitle = await page.title();
                    if (pageTitle.includes('Bir dakika') || pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required')) {
                        console.log('🛡️ Cloudflare/Security Check detected. Initiating evasion protocols...');

                        await solveCloudflareChallenge(page);
                        await new Promise(r => setTimeout(r, 8000));

                        try {
                            await page.mouse.move(100, 100);
                            await page.mouse.move(200, 200);
                        } catch (ev) { }

                        console.log('🛡️ Evasion wait complete. Checking status...');

                        const currentTitle = await page.title();
                        console.log(`Current Title: ${currentTitle}`);

                        if (currentTitle.includes('Bir dakika') || currentTitle.includes('Just a moment') || currentTitle.includes('Attention Required')) {
                            // Still blocked, try forced reload
                            console.log(`⚠️ Still on Cloudflare page. Force reloading target URL: ${pageUrl}`);
                            // Fix: Set Referer to same-origin to look natural
                            await page.setExtraHTTPHeaders({ 'Referer': 'https://www.hepsiemlak.com/' });
                            await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                        } else {
                            console.log('✅ It seems we passed Cloudflare! Proceeding without reload.');
                        }
                    }
                } catch (err) {
                    console.log('Error checking for Cloudflare:', err.message);
                }

                // Smart Wait
                try {
                    await page.waitForSelector('.listing-item', { timeout: 30000 });
                    await saveBrowserState(page);
                } catch (e) {
                    console.log(`⚠️ Timeout waiting for listings on page ${pageNum}.`);

                    try {
                        const title = await page.title();
                        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500).replace(/\n/g, ' '));
                        console.log(`DEBUG VIEW - Title: ${title}`);
                        console.log(`DEBUG BODY: ${bodyText}`);

                        if (title.includes('Bir dakika') || title.includes('Just a moment') || bodyText.includes('Doğrulanıyor') || bodyText.includes('Verify')) {
                            console.log('🛡️ Cloudflare detected during timeout. Attempting to bypass...');
                            await solveCloudflareChallenge(page);
                            await new Promise(r => setTimeout(r, 15000));

                            console.log('🔄 Restarting loop to check if resolved...');
                            retryCount++;
                            continue;
                        }
                    } catch (err) {
                        console.log('Could not get debug info.');
                    }

                    hasNextPage = false;
                    break;
                }

                await page.evaluate(async () => {
                    window.scrollBy(0, 500);
                    await new Promise(r => setTimeout(r, 500));
                });

                const listings = await page.evaluate((forcedSellerType, category) => {
                    const items = document.querySelectorAll('.listing-item');
                    const data = [];
                    items.forEach(item => {
                        const id = item.id;
                        if (!id) return;

                        const titleEl = item.querySelector('.list-view-title h3') || item.querySelector('.list-view-title');
                        const priceEl = item.querySelector('.list-view-price');
                        const locationEl = item.querySelector('.list-view-location');
                        const urlEl = item.querySelector('a.card-link');
                        const imgEl = item.querySelector('img');
                        const dateEl = item.querySelector('.list-view-date');

                        let title = titleEl?.innerText.trim() || imgEl?.getAttribute('alt') || 'İsimsiz İlan';
                        let price = 0;
                        if (priceEl) {
                            const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                            price = parseFloat(raw) || 0;
                        }
                        let district = '';
                        let neighborhood = '';
                        if (locationEl) {
                            const parts = locationEl.innerText.split('/').map(s => s.trim());
                            if (parts.length > 1) district = parts[1];
                            if (parts.length > 2) {
                                let rawNeighborhood = parts[2];
                                let clean = rawNeighborhood.replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim();
                                neighborhood = clean + ' Mah.';
                            }
                        }
                        const url = urlEl ? 'https://www.hepsiemlak.com' + urlEl.getAttribute('href') : '';
                        let size_m2 = 0;
                        let rooms = '';
                        const textContent = item.innerText;
                        const m2Match = textContent.match(/(\d+)\s*m²/);
                        if (m2Match) size_m2 = parseInt(m2Match[1]);
                        const roomMatch = textContent.match(/(\d+\s*\+\s*\d+)/);
                        if (roomMatch) rooms = roomMatch[1].replace(/\s/g, '');

                        let listing_date = null;
                        if (dateEl) {
                            const dateText = dateEl.innerText.trim();
                            const parts = dateText.match(/(\d{2})-(\d{2})-(\d{4})/);
                            if (parts) {
                                listing_date = `${parts[3]}-${parts[2]}-${parts[1]}`;
                            } else {
                                const now = new Date();
                                if (dateText.toLowerCase() === 'bugün') listing_date = now.toISOString().split('T')[0];
                                else if (dateText.toLowerCase() === 'dün') {
                                    now.setDate(now.getDate() - 1);
                                    listing_date = now.toISOString().split('T')[0];
                                }
                            }
                        }

                        let seller_type = forcedSellerType || 'office';
                        let seller_name = 'Bilinmiyor';
                        if (!forcedSellerType) {
                            const ownerInfoEl = item.querySelector('.listing-card--owner-info');
                            if (ownerInfoEl) {
                                const infoText = ownerInfoEl.innerText.trim();
                                seller_name = infoText;
                                const lowerInfo = infoText.toLowerCase();
                                if (lowerInfo.includes('sahibinden')) seller_type = 'owner';
                                else if (lowerInfo.includes('banka')) seller_type = 'bank';
                                else if (lowerInfo.includes('inşaat') || lowerInfo.includes('proje')) seller_type = 'construction';
                            } else {
                                if (item.innerText.toLowerCase().includes('sahibinden satılık')) {
                                    seller_type = 'owner';
                                    seller_name = 'Sahibinden';
                                }
                            }
                        } else {
                            if (forcedSellerType === 'owner') seller_name = 'Sahibinden';
                        }
                        let listing_type = 'sale';
                        if (url.toLowerCase().includes('kiralik')) listing_type = 'rent';
                        data.push({ external_id: id, title, price, url, district, neighborhood, rooms, size_m2, listing_date, seller_type, seller_name, listing_type, category });
                    });
                    return data;
                }, forcedSellerType, category);

                if (listings.length === 0) {
                    hasNextPage = false;
                } else {
                    const newIds = listings.map(l => l.external_id);
                    const existingIds = new Set(allListings.map(l => l.external_id));
                    const isDuplicatePage = newIds.every(id => existingIds.has(id));
                    if (isDuplicatePage && allListings.length > 0) {
                        hasNextPage = false;
                    } else {
                        console.log(`Found ${listings.length} listings. Saving progress...`);
                        await saveListings(listings);
                        allListings = [...allListings, ...listings];
                        pageNum++;
                    }
                }
                pageSuccess = true;
            } catch (e) {
                console.log(`Error on page ${pageNum}: ${e.message}`);
                retryCount++;
                if (retryCount > maxRetries) hasNextPage = false;
            }
        }
    }
    return allListings;
}

async function saveListings(listings) {
    if (listings.length === 0) return;
    console.log(`Saving ${listings.length} listings to DB...`);
    const { sendMatchNotification } = require('./notificationService');
    for (const item of listings) {
        const { external_id, title, price, url, district, neighborhood, rooms, size_m2, listing_date, listing_type, category, seller_type, seller_name } = item;
        try {
            const existingProp = await prisma.property.findUnique({
                where: { external_id: external_id }
            });
            if (existingProp) {
                if (parseFloat(existingProp.price) !== parseFloat(price)) {
                    await prisma.propertyHistory.create({
                        data: {
                            property_id: existingProp.id,
                            price: price,
                            change_type: parseFloat(price) < parseFloat(existingProp.price) ? 'price_decrease' : 'price_increase'
                        }
                    });
                    await prisma.property.update({
                        where: { id: existingProp.id },
                        data: { price: price, last_scraped: new Date() }
                    });
                } else {
                    await prisma.property.update({
                        where: { id: existingProp.id },
                        data: { last_scraped: new Date() }
                    });
                }
            } else {
                const newProp = await prisma.property.create({
                    data: {
                        external_id, title, price, url, district, neighborhood, rooms, size_m2,
                        listing_date: listing_date ? new Date(listing_date) : new Date(),
                        seller_type: seller_type || 'office',
                        seller_name: seller_name || 'Bilinmiyor',
                        listing_type: listing_type || 'sale',
                        category: category || 'daire',
                        last_scraped: new Date()
                    }
                });
                await checkOpportunity(newProp);
                const matches = await findMatchesForProperty(newProp);
                for (const match of matches) {
                    if (match.match_quality >= 80) {
                        try {
                            await prisma.clientProperty.create({
                                data: { client_id: match.client.id, property_id: newProp.id, status: 'concierge', notes: `Otomatik Eşleşme (%${match.match_quality})` }
                            });
                            await sendMatchNotification(match.client, newProp, match.match_quality);
                        } catch (matchErr) { }
                    }
                }
                await sendNewListingNotification(newProp);
            }
        } catch (dbErr) { }
    }
}

async function scrapeEmlakjet(page, url, category = 'residential') {
    console.log(`--- Scraping Emlakjet (${url}) [Category: ${category}] ---`);
    let allListings = [];
    let pageNum = 1;
    let hasNextPage = true;

    while (hasNextPage && pageNum <= 3) {
        const pageUrl = pageNum === 1 ? url : `${url}${pageNum}`;
        console.log(`Navigating to Emlakjet Page ${pageNum}: ${pageUrl}`);

        try {
            await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

            try {
                await page.waitForSelector('a[class*="styles_wrapper__"]', { timeout: 15000 });
            } catch (e) {
                console.log(`⚠️ Timeout waiting for Emlakjet listings on page ${pageNum}.`);
                hasNextPage = false;
                break;
            }

            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

            const listings = await page.evaluate((category) => {
                const items = document.querySelectorAll('a[class*="styles_wrapper__"]');
                const data = [];

                items.forEach(item => {
                    const titleEl = item.querySelector('h3');
                    const spans = Array.from(item.querySelectorAll('span'));
                    const priceEl = spans.find(s => s.innerText.includes('TL'));
                    const locationEl = spans.find(s => s.innerText.includes('Ayvalık - '));
                    const detailsEl = Array.from(item.querySelectorAll('div')).find(s => s.innerText.includes('m²'));

                    if (!titleEl || !priceEl) return;

                    const url = item.href;
                    const idMatch = url.match(/-(\d+)\/?$/) || url.match(/-(\d+)(?:\.html)?$/);
                    const id = idMatch ? idMatch[1] : url.split('-').pop();

                    let title = titleEl.innerText.trim();
                    let price = parseFloat(priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '')) || 0;

                    let district = 'Ayvalık';
                    let neighborhood = '';
                    if (locationEl) {
                        const parts = locationEl.innerText.split('-').map(s => s.trim());
                        if (parts.length > 1) {
                            neighborhood = parts[1].replace(/\s+Mahallesi/i, '').replace(/\s+Mah\.?/i, '').replace(/\s+Mh\.?/i, '').trim() + ' Mah.';
                        }
                    }

                    let size_m2 = 0;
                    let rooms = '';
                    if (detailsEl) {
                        const text = detailsEl.innerText;
                        const parts = text.split('|').map(s => s.trim());
                        const m2Part = parts.find(p => p.includes('m²'));
                        if (m2Part) size_m2 = parseInt(m2Part.replace(/[^\d]/g, '')) || 0;
                        const roomMatch = text.match(/\d\s*\+\s*\d/);
                        if (roomMatch) rooms = roomMatch[0].replace(/\s/g, '');
                    }

                    data.push({
                        external_id: 'ej-' + id,
                        title,
                        price,
                        url,
                        district,
                        neighborhood,
                        rooms,
                        size_m2,
                        listing_date: new Date().toISOString().split('T')[0],
                        seller_type: 'office',
                        seller_name: item.querySelector('div[class*="styles_tagWrapper__"]') ? 'Emlakjet' : (item.querySelector('div[class*="styles_officeName__"]')?.innerText.trim() || 'Emlak Ofisi'),
                        listing_type: url.includes('kiralik') ? 'rent' : 'sale',
                        category
                    });
                });
                return data;
            }, category);

            if (listings.length === 0) {
                hasNextPage = false;
            } else {
                console.log(`Found ${listings.length} listings on page ${pageNum}. Saving progress...`);
                await saveListings(listings);
                allListings = [...allListings, ...listings];
                pageNum++;
            }
        } catch (err) {
            console.error(`Emlakjet Page ${pageNum} Error:`, err.message);
            hasNextPage = false;
        }
    }
    return allListings;
}

const startScheduler = () => {
    cron.schedule('0 */4 * * *', () => {
        scrapeProperties('all');
    });
    console.log('Scraper scheduler started.');
};

const { scrapeSahibindenDetails } = require('./stealthScraper');
async function scrapeDetails(url) {
    if (url.includes('sahibinden.com')) return await scrapeSahibindenDetails(url);
    // Hepsiemlak detail logic...
    console.log(`--- Scraping Hepsiemlak Details (${url}) ---`);
    let browser;
    try {
        const { getOrLaunchBrowser } = require('./stealthScraper');
        browser = await getOrLaunchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const data = await page.evaluate(() => {
            const description = document.querySelector('.description-content')?.innerText.trim() || '';
            let images = [];
            document.querySelectorAll('.detail-gallery img').forEach(img => images.push(img.src));
            images = [...new Set(images)];
            const features = [];
            document.querySelectorAll('.spec-item').forEach(item => {
                features.push(item.innerText.replace(/\n/g, ': ').trim());
            });
            const infoMap = {};
            document.querySelectorAll('.spec-item').forEach(item => {
                const label = item.querySelector('.spec-item-label')?.innerText.trim();
                const value = item.querySelector('.spec-item-value')?.innerText.trim();
                if (label && value) infoMap[label] = value;
            });
            let building_age = infoMap['Bina Yaşı'] || null;
            let heating_type = infoMap['Isınma Tipi'] || null;
            let floor_location = infoMap['Bulunduğu Kat'] || null;
            let size_m2 = parseInt(infoMap['Brüt Metrekare'] || infoMap['Metrekare'] || 0);
            let rooms = infoMap['Oda + Salon Sayısı'] || null;
            const seller_name = document.querySelector('.firm-card-name')?.innerText.trim() || 'Bilinmiyor';
            const seller_phone = document.querySelector('.phone-number')?.innerText.trim() || null;
            return { description, images, features, seller_name, seller_phone, building_age, heating_type, floor_location, size_m2, rooms };
        });
        return data;
    } catch (e) {
        console.error('Hepsiemlak Detail Scrape Error:', e);
        throw e;
    } finally {
        if (browser) {
            const pages = await browser.pages();
            if (pages.length > 2) await pages[pages.length - 1].close();
        }
    }
}

module.exports = { scrapeProperties, startScheduler, scrapeDetails, saveListings };
