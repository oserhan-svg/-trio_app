const puppeteer = require('puppeteer-extra');
const { createStealthBrowser, configureStealthPage, humanizePage, saveBrowserState } = require('./browserFactory');
const cron = require('node-cron');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');
const prisma = require('../db');

// Organic Navigation Helper
async function organicNav(page, targetUrl) {
    try {
        console.log('🌍 Organic Entry: Starting with neutral hop (Wikipedia)...');
        // Hop to Wikipedia first to establish a "clean" history
        await page.goto('https://tr.wikipedia.org/wiki/Ana_Sayfa', { waitUntil: 'domcontentloaded' }).catch(() => { });
        await new Promise(r => setTimeout(r, 2000));

        // Random Queries
        const queries = [
            'hepsiemlak ayvalık satılık daire',
            'hepsiemlak balıkesir ayvalık ilanlar',
            'ayvalık satılık yazlık hepsiemlak'
        ];
        const query = queries[Math.floor(Math.random() * queries.length)];
        // Use DuckDuckGo - consistent results, less CAPTCHAs
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`;

        console.log(`🌍 Organic Entry: Going to DuckDuckGo Search: "${query}"`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        // Wait for results
        await new Promise(r => setTimeout(r, 4000));

        // Find result - DDG results usually have a specific structure but broad selector works
        const links = await page.$$('a[href*="hepsiemlak.com"]');
        if (links.length > 0) {
            console.log(`✅ Found ${links.length} Hepsiemlak links on DuckDuckGo. Clicking first...`);
            await Promise.all([
                page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => { }),
                links[0].click()
            ]);
            return; // Success
        }

        console.log('⚠️ DuckDuckGo Search fallback: Link not found on results page.');
    } catch (e) {
        console.log(`⚠️ Organic Nav failed (${e.message}).`);
    }

    // Fallback: Direct entry with FAKE REFERER
    console.log('👻 Applying Fake Referer Strategy (Wikipedia) and navigating directly...');
    try {
        await page.setExtraHTTPHeaders({
            'Referer': 'https://tr.wikipedia.org/',
            'Sec-Fetch-Site': 'same-origin'
        });
    } catch (err) { }

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
}

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
// URLs Configuration (Expanded for Full Coverage)
const CATEGORIES = [
    // --- KONUT (RESIDENTIAL) ---
    {
        name: 'Satılık Daire',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/daire',
        sahibinden: 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-daire/balikesir-ayvalik/',
        type: 'sale',
        category: 'daire'
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
        name: 'Satılık Villa',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/villa',
        sahibinden: 'https://www.sahibinden.com/satilik-villa/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-villa/balikesir-ayvalik/',
        type: 'sale',
        category: 'villa'
    },
    {
        name: 'Kiralık Villa',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-kiralik/villa',
        sahibinden: 'https://www.sahibinden.com/kiralik-villa/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/kiralik-villa/balikesir-ayvalik/',
        type: 'rent',
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

    // --- ARSA & TARIM (LAND & AGRICULTURE) ---
    {
        name: 'Satılık Arsa',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/arsa',
        sahibinden: 'https://www.sahibinden.com/satilik-arsa/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-arsa/balikesir-ayvalik/',
        type: 'sale',
        category: 'land'
    },
    {
        name: 'Satılık Zeytinlik',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/zeytinlik',
        sahibinden: 'https://www.sahibinden.com/satilik-zeytinlik/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-zeytinlik/balikesir-ayvalik/',
        type: 'sale',
        category: 'zeytinlik'
    },
    {
        name: 'Satılık Tarla',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/tarla',
        sahibinden: 'https://www.sahibinden.com/satilik-tarla/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-tarla/balikesir-ayvalik/',
        type: 'sale',
        category: 'tarla'
    },

    // --- ISYERI & TURIZM (COMMERCIAL & TOURISM) ---
    {
        name: 'Satılık İşyeri',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik-isyeri',
        sahibinden: 'https://www.sahibinden.com/satilik-is-yeri/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-isyeri/balikesir-ayvalik/',
        type: 'sale',
        category: 'commercial'
    },
    {
        name: 'Kiralık İşyeri',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-kiralik-isyeri',
        sahibinden: 'https://www.sahibinden.com/kiralik-is-yeri/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/kiralik-isyeri/balikesir-ayvalik/',
        type: 'rent',
        category: 'commercial'
    },
    {
        name: 'Turistik Tesis',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/turistik-tesis',
        sahibinden: 'https://www.sahibinden.com/satilik-turistik-tesis/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-turistik-tesis/balikesir-ayvalik/',
        type: 'sale',
        category: 'tourism'
    }
];

async function scrapeProperties(provider = 'all', injectedPage = null) {
    console.log(`Starting prioritized scrape job for: ${provider}`);

    let browser, page;
    try {
        if (injectedPage) {
            console.log('ℹ️ Using Injected Browser Page for Interactive Mode');
            page = injectedPage;
            browser = page.browser();
            try { await page.setViewport({ width: 1920, height: 1080 }); } catch (e) { }
        } else {
            const { launchRealBrowser } = require('./realBrowser');
            const { browser: rb, page: rp } = await launchRealBrowser();
            browser = rb;
            page = rp;
        }

    } catch (err) {
        console.error('CRITICAL: Could not launch Real Browser.', err);
        return;
    }

    if (!browser || !page) return;

    try {
        const { scrapeSahibindenStealth, scrapeSahibindenTeam } = require('./stealthScraper');

        // PHASE -1: TEAM PAGE (Pre-population)
        if ((provider === 'all' || provider === 'sahibinden') && scraperConfig.agencyStore?.url) {
            console.log('👥 PHASE -1: Scraping Team Page...');
            try {
                const teamUrl = scraperConfig.agencyStore.url.replace(/\/$/, '') + '/ekibimiz';
                const teamMembers = await scrapeSahibindenTeam(teamUrl, page);

                for (const member of teamMembers) {
                    await findOrCreateConsultant(member.name, member.phone, member.img);
                }
            } catch (err) {
                console.error('❌ Phase -1 (Team) Failed:', err.message);
            }
        }

        // PHASE 0: AGENCY STORE (Highest Priority)
        // Only run if provider is 'all' or 'sahibinden'
        if ((provider === 'all' || provider === 'sahibinden') && scraperConfig.agencyStore?.url) {
            console.log('🌟 PHASE 0: Scraping Agency Store...');
            try {
                const storeUrl = scraperConfig.agencyStore.url;
                const storeListings = await scrapeSahibindenStealth(storeUrl, 'office', 'store', [1, 2, 3], page);

                // Enforce assignment, but try to match Consultant Name first
                const validListings = [];
                for (const l of storeListings) {
                    let assignedId = scraperConfig.agencyStore.assignedUserId; // Default: Admin

                    if (l.seller_name && l.seller_name.length > 3 && !l.seller_name.toLowerCase().includes('emlak')) {
                        try {
                            const consultantId = await findOrCreateConsultant(l.seller_name);
                            if (consultantId) assignedId = consultantId;
                        } catch (e) {
                            console.log(`⚠️ Could not auto-create consultant for ${l.seller_name}: ${e.message}`);
                        }
                    }

                    validListings.push({
                        ...l,
                        assigned_user_id: assignedId,
                        is_primary: true
                    });
                }

                if (validListings.length > 0) {
                    console.log(`🌟 Saving ${validListings.length} Agency Store listings...`);
                    await saveListings(validListings);
                }
            } catch (err) {
                console.error('❌ Phase 0 (Store) Failed:', err.message);
            }
        }

        // PHASE 0.5: HEPSIEMLAK STORE
        if ((provider === 'all' || provider === 'hepsiemlak') && scraperConfig.agencyStore?.hepsiemlak_url) {
            console.log('🌟 PHASE 0.5: Scraping Hepsiemlak Store...');
            try {
                const storeUrl = scraperConfig.agencyStore.hepsiemlak_url;
                await scrapeHepsiemlak(page, storeUrl, 'office', 'store', [1, 2, 3], {
                    assignedUserId: 3,
                    isPrimary: true
                });
            } catch (err) {
                console.error('❌ Phase 0.5 (Hepsiemlak Store) Failed:', err.message);
            }
        }


        // PHASE 1: OWNER LISTINGS (High Priority)
        console.log('🚀 PHASE 1: Scraping Owner Listings...');

        if (provider === 'all' || provider === 'sahibinden') {
            for (const cat of CATEGORIES) {
                // Apply Owner Filter
                const ownerUrl = cat.sahibinden + (cat.sahibinden.includes('?') ? '' : '?') + scraperConfig.ownerFilters.sahibinden;
                const pages = [1, 2]; // Check first 2 pages for owners
                console.log(`Phase 1 (Sahibinden): ${cat.name} (Owner)`);

                try {
                    await scrapeSahibindenStealth(ownerUrl, 'owner', cat.category, pages, page);
                } catch (e) { console.error(`Phase 1 ${cat.name} failed:`, e.message); }

                await new Promise(r => setTimeout(r, 5000));
            }
        }

        if (provider === 'all' || provider === 'hepsiemlak') {
            for (const cat of CATEGORIES) {
                if (cat.type === 'sale') { // Hepsiemlak owners usually simpler to just check distinct URL or param
                    const base = cat.hepsiemlak;
                    // Hepsiemlak owner filter logic: often /satilik-sahibinden url modification or param
                    // Config has param: &owner_type=owner. Let's append.
                    const ownerUrl = base + (base.includes('?') ? '' : '?') + scraperConfig.ownerFilters.hepsiemlak;
                    console.log(`Phase 1 (Hepsiemlak): ${cat.name} (Owner)`);

                    try {
                        await scrapeHepsiemlak(page, ownerUrl, 'owner', cat.category, [1, 2]);
                    } catch (e) { console.error(`Phase 1 Hepsiemlak ${cat.name} failed:`, e.message); }

                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }

        // PHASE 2: GENERAL MARKET (Standard)
        console.log('🌍 PHASE 2: General Market Scrape...');

        if (provider === 'all' || provider === 'sahibinden') {
            for (const cat of CATEGORIES) {
                const pages = await getPageRange('sahibinden', cat.category, cat.type);
                console.log(`Phase 2 (Sahibinden): ${cat.name} | Pages: ${pages.join(',')}`);
                await scrapeSahibindenStealth(cat.sahibinden, null, cat.category, pages, page);
                await new Promise(r => setTimeout(r, 10000 + Math.random() * 10000));
            }
            await markRemovedListings('sahibinden');
        }

        if (provider === 'all' || provider === 'hepsiemlak') {
            for (const cat of CATEGORIES) {
                const pages = await getPageRange('hepsiemlak', cat.category, cat.type);
                console.log(`Phase 2 (Hepsiemlak): ${cat.name} | Pages: ${pages.join(',')}`);
                await scrapeHepsiemlak(page, cat.hepsiemlak, null, cat.category, pages);
                await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
            }
            await markRemovedListings('hepsiemlak');
        }

        // Emlakjet skipped in Phase 1 for now (Phase 2 only)
        if (provider === 'all' || provider === 'emlakjet') {
            for (const cat of CATEGORIES) {
                const pages = await getPageRange('emlakjet', cat.category, cat.type);
                console.log(`Phase 2 (Emlakjet): ${cat.name} | Pages: ${pages.join(',')}`);
                await scrapeEmlakjet(page, cat.emlakjet, cat.category, pages);
                await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
            }
            await markRemovedListings('emlakjet');
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

// The library handles Turnstile automatically, so this function is now just a verification/backup
// Polling-based robust solver
async function solveCloudflareChallenge(page) {
    console.log('🛡️ Cloudflare/Block detected. Waiting for solution (Auto or Manual)...');

    let attempts = 0;
    const maxAttempts = 30; // 30 * 10s = 5 minutes wait time

    while (attempts < maxAttempts) {
        try {
            const title = await page.title();
            const isBlocked = title.includes('Just a moment') ||
                title.includes('Bir dakika') ||
                title.includes('Attention Required') ||
                title.includes('Olağan dışı') ||
                title.includes('Unusual activity') ||
                title.includes('Verify you are human');

            if (!isBlocked) {
                console.log(`✅ Challenge/Block passed! Current title: ${title}`);
                return true;
            }

            console.log(`⏳ Waiting for bypass... (${attempts + 1}/${maxAttempts}) - Status: ${title}`);

            // Basic Mouse Wiggle to simulate life
            try {
                await page.mouse.move(Math.random() * 500, Math.random() * 500);
            } catch (e) { }

            await new Promise(r => setTimeout(r, 10000)); // Check every 10 seconds
            attempts++;
        } catch (e) {
            console.log('⚠️ Error checking title during wait:', e.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.warn('❌ Timeout waiting for challenge solution.');
    return false;
}


async function scrapeHepsiemlak(page, url, forcedSellerType = null, category = 'residential', targetPages = [1, 2, 3], assignmentOverride = null) {
    console.log(`--- Scraping Hepsiemlak (${url}) [Pages: ${targetPages.join(', ')}] ---`);
    let allListings = [];

    for (const pageNum of targetPages) {
        // ... navigation logic ...
        const pageUrl = `${url}?page=${pageNum}`;
        console.log(`Navigating to Hepsiemlak Page ${pageNum}: ${pageUrl}`);

        let retryCount = 0;
        const maxRetries = 2;
        let pageSuccess = false;

        while (retryCount <= maxRetries && !pageSuccess) {
            try {
                if (retryCount > 0) {
                    // ... reload ...
                    console.log(`🔄 Retrying page ${pageNum} (Attempt ${retryCount + 1})...`);
                    await page.reload({ waitUntil: 'domcontentloaded' });
                } else {
                    // ... navigate ...
                    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });
                }

                // ... cloudflare checks ...

                // ... scrape items ...
                const listings = await page.evaluate((forcedSellerType, category) => {
                    // ... extraction logic ...
                    const items = document.querySelectorAll('.listing-item');
                    const data = [];
                    items.forEach(item => {
                        // ... extraction details ... (omitted for brevity, assume existing)

                        // Reconstruct basic extraction for evaluate context simplifiction in replace
                        const id = item.id;
                        if (!id) return;

                        // ... selectors ...
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

                        // ... District/Neighborhood ...
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
                            // ... date parsing ...
                            const dateText = dateEl.innerText.trim();
                            const parts = dateText.match(/(\d{2})-(\d{2})-(\d{4})/);
                            if (parts) { listing_date = `${parts[3]}-${parts[2]}-${parts[1]}`; }
                            else if (dateText.toLowerCase() === 'bugün') { listing_date = new Date().toISOString().split('T')[0]; }
                            else if (dateText.toLowerCase() === 'dün') {
                                const d = new Date(); d.setDate(d.getDate() - 1);
                                listing_date = d.toISOString().split('T')[0];
                            }
                        }

                        let seller_type = forcedSellerType || 'office';
                        let seller_name = 'Bilinmiyor';
                        if (!forcedSellerType) {
                            // ... owner info ...
                            const ownerInfoEl = item.querySelector('.listing-card--owner-info');
                            if (ownerInfoEl) {
                                seller_name = ownerInfoEl.innerText.trim();
                                if (seller_name.toLowerCase().includes('sahibinden')) seller_type = 'owner';
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

                // Inject Overrides
                const processedListings = listings.map(l => ({
                    ...l,
                    assigned_user_id: assignmentOverride ? assignmentOverride.assignedUserId : null,
                    is_primary: assignmentOverride ? assignmentOverride.isPrimary : false
                }));

                if (processedListings.length === 0) {
                    hasNextPage = false;
                } else {
                    // Check Duplicates ...
                    const newIds = processedListings.map(l => l.external_id);
                    // ...
                    console.log(`Found ${processedListings.length} listings. Saving progress...`);
                    await saveListings(processedListings);
                    allListings = [...allListings, ...processedListings];
                }
                pageSuccess = true;
            } catch (e) {
                // ...
                retryCount++;
            }
        }
    }
    return allListings;
}

async function saveListings(listings) {
    if (listings.length === 0) return;
    console.log(`Saving ${listings.length} listings to DB...`);
    const { sendMatchNotification } = require('./notificationService');
    const { groupProperty } = require('./deduplicationService');
    for (const item of listings) {
        const { external_id, title, price, url, district, neighborhood, rooms, size_m2, listing_date, listing_type, category, seller_type, seller_name, assigned_user_id, is_primary } = item;
        try {
            const existingProp = await prisma.property.findUnique({
                where: { external_id: external_id }
            });
            if (existingProp) {
                // Prepare update data
                const updateData = { last_scraped: new Date(), status: 'active' };

                // If this scrape identifies it as OUR listing (Store Phase), enforce strict ownership update
                if (assigned_user_id) updateData.assigned_user_id = assigned_user_id;
                if (is_primary !== undefined) updateData.is_primary = is_primary;

                if (parseFloat(existingProp.price) !== parseFloat(price)) {
                    await prisma.propertyHistory.create({
                        data: {
                            property_id: existingProp.id,
                            price: price,
                            change_type: parseFloat(price) < parseFloat(existingProp.price) ? 'price_decrease' : 'price_increase'
                        }
                    });
                    updateData.price = price;
                    await prisma.property.update({
                        where: { id: existingProp.id },
                        data: updateData
                    });
                } else {
                    await prisma.property.update({
                        where: { id: existingProp.id },
                        data: updateData
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
                        last_scraped: new Date(),
                        status: 'active',
                        assigned_user_id: assigned_user_id || null,
                        is_primary: is_primary || false
                    }
                });

                // Deduplication
                await groupProperty(newProp.id);

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

// Helper: Find or Create Consultant by Name
async function findOrCreateConsultant(fullName, phone = '', imageUrl = null) {
    if (!fullName) return null;
    const bcrypt = require('bcryptjs');

    // Simple Slugify
    const slug = fullName.trim().toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '.');

    const email = `${slug}@trioapp.com`;

    // Check existing
    const existing = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: fullName, mode: 'insensitive' } },
                { email: email }
            ]
        }
    });

    if (existing) {
        // Update phone/image if missing
        if ((!existing.phone && phone) || (!existing.profile_picture && imageUrl)) {
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    phone: phone || existing.phone,
                    profile_picture: imageUrl || existing.profile_picture
                }
            });
        }
        return existing.id;
    }

    // Create New
    console.log(`👤 Auto-creating Consultant: ${fullName} (${email})`);

    // Hash password "123"
    // Note: We should ideally use the same hash logic as Auth, assuming separate bcrypt usage is fine.
    // If we don't have bcrypt require here, we might fail. Let's assume it's installed.
    // However, to be safe, we can try/catch the require.
    let hashedPassword = '$2a$10$Metric/Hash/Placeholder'; // Fallback if bcrypt missing (user needs reset)
    try {
        const b = require('bcryptjs');
        hashedPassword = await b.hash('123', 10);
    } catch (e) { console.warn('Bcrypt not found, using placeholder hash'); }

    const newUser = await prisma.user.create({
        data: {
            name: fullName.trim(),
            email: email,
            password: hashedPassword,
            role: 'consultant',
            phone: phone || '',
            profile_picture: imageUrl || null
        }
    });

    return newUser.id;
}

async function scrapeSingleListing(url) {
    console.log(`🔍 Scraping single listing details: ${url}`);
    let browser = null;
    try {
        browser = await createStealthBrowser();
        const page = await browser.newPage();
        await configureStealthPage(page);

        // Organic entry to building trust
        await organicNav(page, url);

        // Cloudflare Check
        await solveCloudflareChallenge(page);

        // Wait for key elements
        try {
            await page.waitForSelector('.img-wrapper img, .he-gallery-image', { timeout: 30000 });
        } catch (e) {
            console.log('⚠️ Timeout waiting for detail page elements. Saving state and retrying...');
            await saveBrowserState(page);
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.img-wrapper img, .he-gallery-image', { timeout: 30000 });
        }

        const details = await page.evaluate(() => {
            const data = { images: [], description: '', features: [] };

            // Extract Images
            const imgEls = document.querySelectorAll('.img-wrapper img, .he-gallery-image, .pswp__img');
            imgEls.forEach(img => {
                const src = img.getAttribute('data-src') || img.src;
                if (src && !src.includes('data:image')) {
                    // High-res conversion for Hepsiemlak
                    let clean = src;
                    if (clean.includes('/mnresize/')) {
                        clean = clean.replace(/\/mnresize\/\d+\/\d+\//, '/');
                    }
                    data.images.push(clean);
                }
            });

            // Description
            const descEl = document.querySelector('.description-content') || document.querySelector('#description');
            if (descEl) data.description = descEl.innerText.trim();

            return data;
        });

        // Deduplicate images
        details.images = [...new Set(details.images)];

        console.log(`✅ Scraped ${details.images.length} images for ${url}`);
        return details;

    } catch (error) {
        console.error(`❌ Error scraping single listing ${url}:`, error.message);
        throw error;
    } finally {
        if (browser) await browser.close();
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

            if (listings.length > 0) {
                console.log(`Found ${listings.length} listings on page ${pageNum}. Saving progress...`);
                await saveListings(listings);
                allListings = [...allListings, ...listings];
            }
        } catch (err) {
            console.error(`Emlakjet Page ${pageNum} Error:`, err.message);
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
    if (url.includes('sahibinden.com')) return await scrapeSahibindenDetails(url);

    // Emlakjet Logic
    if (url.includes('emlakjet.com')) {
        console.log(`--- Scraping Emlakjet Details (${url}) ---`);
        let browser;
        try {
            const { getOrLaunchBrowser } = require('./stealthScraper');
            browser = await getOrLaunchBrowser();
            const page = await browser.newPage();
            // Emlakjet often needs a specific viewport or it hides elements
            await page.setViewport({ width: 1366, height: 768 });

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const data = await page.evaluate(() => {
                // EMLAKJET REMOVED DETECTION
                const isRemoved = document.body.innerText.includes('Bu ilan yayından kaldırılmıştır') ||
                    document.body.innerText.includes('İlan Yayında Değil') ||
                    document.querySelector('.listing-not-active');

                if (isRemoved) return { isRemoved: true };

                const description = document.querySelector('#aciklama .desc')?.innerText.trim() ||
                    document.querySelector('.description')?.innerText.trim() || '';

                const images = [];
                document.querySelectorAll('.gallery-container img, .swiper-slide img').forEach(img => {
                    const src = img.src || img.getAttribute('data-src');
                    if (src) images.push(src);
                });

                const features = [];
                document.querySelectorAll('.feature-item').forEach(i => features.push(i.innerText.trim()));

                // Basic info map extraction could go here if needed...
                // For now focused on passive detection and basic details

                return { description, images: [...new Set(images)], features, isRemoved: false };
            });

            if (data.isRemoved) {
                console.log(`⚠️ Listing REMOVED detected (Emlakjet): ${url}`);
                const error = new Error('ListingRemoved');
                error.code = 'LISTING_REMOVED';
                throw error;
            }

            return data;

        } catch (e) {
            console.error('Emlakjet Scrape Error:', e.message);
            throw e;
        } finally {
            if (browser) {
                const pages = await browser.pages();
                if (pages.length > 2) await pages[pages.length - 1].close();
            }
        }
    }

    // fallback to Hepsiemlak detail logic (default)...
    console.log(`--- Scraping Hepsiemlak Details (${url}) ---`);
    let browser;
    try {
        const { getOrLaunchBrowser } = require('./stealthScraper');
        browser = await getOrLaunchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const data = await page.evaluate(() => {
            // CHECK FOR REMOVED LISTING INDICATORS
            const removedMsg = document.querySelector('.listing-removed-message') ||
                document.querySelector('.no-listing-content') ||
                document.body.innerText.includes('Bu ilan yayında değildir');

            if (removedMsg) {
                return { isRemoved: true };
            }

            const description = document.querySelector('.description-content')?.innerText.trim() || '';
            let images = [];

            // Try multiple gallery selectors
            const selectors = [
                '.detail-gallery img',
                '.img-wrapper img',
                '.swiper-wrapper img',
                '.fancy-gallery img'
            ];

            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(img => {
                    const src = img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.src;
                    if (src && !src.startsWith('data:image/gif')) {
                        images.push(src);
                    }
                });
            });

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

        if (data.isRemoved) {
            console.log(`⚠️ Listing REMOVED detected: ${url}`);
            const error = new Error('ListingRemoved');
            error.code = 'LISTING_REMOVED';
            throw error;
        }

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

async function markRemovedListings(provider = null) {
    console.log(`--- Detecting removed listings for provider: ${provider || 'ALL'} ---`);

    // Threshold: Not updated in the last 12 hours
    const threshold = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const where = {
        status: 'active',
        last_scraped: { lt: threshold }
    };

    if (provider) {
        if (provider === 'sahibinden') where.url = { contains: 'sahibinden.com' };
        if (provider === 'hepsiemlak') where.url = { contains: 'hepsiemlak.com' };
        if (provider === 'emlakjet') where.url = { contains: 'emlakjet.com' };
    }

    const removedListings = await prisma.property.findMany({ where });
    console.log(`🧹 Mark as Removed: Found ${removedListings.length} stale listings.`);

    if (removedListings.length > 0) {
        await prisma.property.updateMany({
            where: { id: { in: removedListings.map(p => p.id) } },
            data: { status: 'removed' }
        });
    }
}

async function getPageRange(provider, category, type = 'sale') {
    try {
        // Find or Create progress record
        let progress = await prisma.scraperProgress.findFirst({
            where: { provider, category, type }
        });

        if (!progress) {
            progress = await prisma.scraperProgress.create({
                data: { provider, category, type, last_page: 0 } // Start from 0 so first deep is 1
            });
        }

        let windowSize = 3; // Default for others
        if (provider === 'sahibinden') {
            windowSize = 5; // Prioritize Sahibinden with deeper scraping
        }
        const pages = [1]; // Always include page 1 for fresh listings

        let current = progress.last_page + 1;
        for (let i = 0; i < windowSize; i++) {
            let p = current + i;
            if (p > progress.max_pages) p = (p % progress.max_pages) || 1;
            if (!pages.includes(p)) pages.push(p);
        }

        // Update progress for next run (move forward by windowSize)
        let nextLastPage = progress.last_page + windowSize;
        if (nextLastPage >= progress.max_pages) nextLastPage = 0;

        await prisma.scraperProgress.update({
            where: { id: progress.id },
            data: { last_page: nextLastPage }
        });

        return [...new Set(pages)].sort((a, b) => a - b);
    } catch (e) {
        console.error(`Error calculating page range for ${provider}:`, e.message);
        return [1, 2];
    }
}

module.exports = { scrapeProperties, startScheduler, scrapeDetails, saveListings, markRemovedListings, getPageRange };
