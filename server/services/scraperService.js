const puppeteer = require('puppeteer-extra');
const { createStealthBrowser, configureStealthPage, humanizePage, saveBrowserState } = require('./browserFactory');
const cron = require('node-cron');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');
const prisma = require('../db');

// ===== ENHANCED SCRAPING MODULES (Phase 1 + Phase 2) =====
const { getFullyEnhancedBrowser } = require('./proxyIntegration');
const { getSessionManager } = require('./sessionManager');
const { addEnhancedHumanBehavior, getAdaptiveDelay } = require('./enhancedScraperUtils');
const { isOptimalScrapingTime } = require('./temporalDelays');
// =========================================================
const { generatePropertyTitle } = require('../scripts/fix_nameless_titles');
const propertyRefiner = require('./propertyRefiner');

// Simple p-limit implementation for concurrency control
const pLimit = (concurrency) => {
    const queue = [];
    let activeCount = 0;

    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            queue.shift()();
        }
    };

    const run = async (fn, resolve, ...args) => {
        activeCount++;
        const result = (async () => fn(...args))();
        try {
            const res = await result;
            resolve(res);
        } catch (err) {
            throw err;
        } finally {
            next();
        }
    };

    const enqueue = (fn, ...args) => new Promise((resolve, reject) => {
        queue.push(run.bind(null, fn, resolve, ...args));
        if (activeCount < concurrency && queue.length > 0) {
            queue.shift()();
        }
    });

    const generator = (fn, ...args) => enqueue(fn, ...args);
    return generator;
};

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
    // PRIORITIZED RENTALS
    {
        name: 'Kiralık Daire',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-kiralik/daire',
        sahibinden: 'https://www.sahibinden.com/kiralik-daire/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/kiralik-daire/balikesir-ayvalik/',
        type: 'rent',
        category: 'daire'
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
        name: 'Kiralık İşyeri',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-kiralik-isyeri',
        sahibinden: 'https://www.sahibinden.com/kiralik-is-yeri/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/kiralik-isyeri/balikesir-ayvalik/',
        type: 'rent',
        category: 'commercial'
    },

    // SALES
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
        name: 'Turistik Tesis',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-satilik/turistik-tesis',
        sahibinden: 'https://www.sahibinden.com/satilik-turistik-tesis/balikesir-ayvalik',
        emlakjet: 'https://www.emlakjet.com/satilik-turistik-tesis/balikesir-ayvalik/',
        type: 'sale',
        category: 'tourism'
    }
];

async function scrapeProperties(provider = 'all', injectedPage = null) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 ENHANCED SCRAPER - Starting prioritized scrape job for: ${provider}`);
    console.log(`${'='.repeat(70)}\n`);

    // Check optimal scraping time
    if (!isOptimalScrapingTime()) {
        console.log('⏰ Note: Current time is outside optimal hours (9-20 Turkey time)');
        console.log('   Delays will be longer to mimic reduced activity...\n');
    }

    let browser, page, sessionManager;

    // Performance tracking
    const scrapeStartTime = Date.now();
    let totalListingsScraped = 0;

    try {
        if (injectedPage) {
            console.log('ℹ️ Using Injected Browser Page for Interactive Mode');
            page = injectedPage;
            browser = page.browser();
            sessionManager = getSessionManager();

            // Add enhanced behavior to injected page
            await addEnhancedHumanBehavior(page);

            try { await page.setViewport({ width: 1920, height: 1080 }); } catch (e) { }
        } else {
            // ===== SIMPLE BROWSER LAUNCH (BYPASS FIX) =====
            // The advanced modules are causing launch failures. We revert to the proven basic factory.
            console.log('🚀 Launching SIMPLE Browser (Safe Mode)...');
            // Ensure we use the factory that we know works (test_visible.js used this)
            const { createStealthBrowser, configureStealthPage } = require('./browserFactory');

            browser = await createStealthBrowser({
                headless: false, // Force visible
                userDataDir: scraperConfig.paths.userDataDir // Use v4 profile
            });

            // Get first page or create new
            const pages = await browser.pages();
            page = pages.length > 0 ? pages[0] : await browser.newPage();

            await configureStealthPage(page);

            await configureStealthPage(page);

            // USE REAL SESSION MANAGER (Fixes 0 Listings Issue)
            const { getSessionManager } = require('./sessionManager');
            sessionManager = getSessionManager();
            sessionManager.setBrowser(browser, page);
            sessionManager.addEvent('Scraper başlatıldı (Real Session).', 'info');

            console.log('✅ Simple Browser Ready (Mode: Safe/Direct)');
            console.log('   - Mode: DIRECT (Bypassing Advanced/Proxy Layers)');
            console.log('   - Visible: YES');

            // Launch verified. Proceeding to scraping.
            // ===============================================
            // ===============================================
        }

    } catch (err) {
        console.error('CRITICAL: Could not launch Enhanced Browser.', err);
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
            sessionManager.addEvent('Sahibinden Ofis İlanları taranıyor...', 'info', 'sahibinden');
            try {
                const storeUrl = scraperConfig.agencyStore.url;
                const storeListings = await scrapeSahibindenStealth(storeUrl, 'office', 'store', [1, 2, 3], page);

                sessionManager.addEvent(`Sahibinden Ofis: ${storeListings.length} ilan bulundu.`, 'success', 'sahibinden');

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

                    // Track listings for dashboard stats
                    sessionManager.trackRequest(true, 'sahibinden');
                    sessionManager.trackListings('sahibinden', validListings.length);

                    await saveListings(validListings);
                    totalListingsScraped += validListings.length;

                    // Standardized Cookie Persistence
                    if (page) await saveBrowserState(page);
                }
            } catch (err) {
                console.error('❌ Phase 0 (Store) Failed:', err.message);
            }
        }

        // PHASE 0.5: HEPSIEMLAK STORE (By Consultants)
        if ((provider === 'all' || provider === 'hepsiemlak') && scraperConfig.agencyStore?.hepsiemlak_url) {
            console.log('🌟 PHASE 0.5: Scraping Hepsiemlak Store (By Consultants)...');
            try {
                if (scraperConfig.agencyStore.hepsiemlak_consultants && scraperConfig.agencyStore.hepsiemlak_consultants.length > 0) {
                    for (const consultant of scraperConfig.agencyStore.hepsiemlak_consultants) {
                        console.log(`👤 Syncing Hepsiemlak Store for: ${consultant.name}`);
                        sessionManager.addEvent(`Hepsiemlak: ${consultant.name} portföyü taranıyor...`, 'info', 'hepsiemlak');
                        await scrapeHepsiemlak(page, consultant.url, 'office', 'store', [1, 2], {
                            consultantName: consultant.name,
                            isPrimary: true
                        });
                        await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
                    }
                } else {
                    const storeUrl = scraperConfig.agencyStore.hepsiemlak_url;
                    await scrapeHepsiemlak(page, storeUrl, 'office', 'store', [1, 2, 3], {
                        assignedUserId: 3,
                        isPrimary: true
                    });
                }
            } catch (err) {
                console.error('❌ Phase 0.5 (Hepsiemlak Store) Failed:', err.message);
            }
        }


        // PHASE 1 & 2: Parallel Portal Scraping
        console.log('🌍 STARTING PARALLEL MULTI-PORTAL SCRAPE...');
        const portalTasks = [];

        // 1. SAHIBINDEN TASK
        if (provider === 'all' || provider === 'sahibinden') {
            portalTasks.push((async () => {
                console.log('⚡ Starting Parallel Sahibinden Scrape...');
                const limit = pLimit(2);

                // Sahibinden Owners (High Priority)
                const ownerTasks = CATEGORIES.map(cat => limit(async () => {
                    let taskPage;
                    try {
                        taskPage = await browser.newPage();
                        await humanizePage(taskPage);
                        const ownerFilter = scraperConfig.ownerFilters?.sahibinden || 'a5_min=1&a5_max=1';
                        const ownerUrl = cat.sahibinden + (cat.sahibinden.includes('?') ? '&' : '?') + ownerFilter;
                        const listings = await scrapeSahibindenStealth(ownerUrl, 'owner', cat.category, [1, 2], taskPage, cat.type);
                        totalListingsScraped += (listings?.length || 0);
                    } catch (e) { console.error(`Sahibinden Owner ${cat.name} failed:`, e.message); }
                    finally { if (taskPage) await taskPage.close(); }
                }));

                // Sahibinden General (Standard)
                const generalTasks = CATEGORIES.map(cat => limit(async () => {
                    let taskPage;
                    try {
                        const pages = await getPageRange('sahibinden', cat.category, cat.type);
                        taskPage = await browser.newPage();
                        await humanizePage(taskPage);
                        const listings = await scrapeSahibindenStealth(cat.sahibinden, null, cat.category, pages, taskPage, cat.type);
                        totalListingsScraped += (listings?.length || 0);
                    } catch (e) { console.error(`Sahibinden General ${cat.name} failed:`, e.message); }
                    finally { if (taskPage) await taskPage.close(); }
                }));

                // Prioritize Owner Tasks
                console.log('💎 Running Priority Owner Tasks (Sahibinden)...');
                await Promise.all(ownerTasks);

                // Then run General Tasks
                console.log('📊 Running General Market Tasks (Sahibinden)...');
                await Promise.all(generalTasks);
                await markRemovedListings('sahibinden');
                console.log('✅ Sahibinden Scrape Finished.');
            })());
        }

        // 2. HEPSIEMLAK TASK
        if (provider === 'all' || provider === 'hepsiemlak') {
            portalTasks.push((async () => {
                console.log('⚡ Starting Parallel Hepsiemlak Scrape...');
                const limit = pLimit(2);

                const tasks = CATEGORIES.map(cat => limit(async () => {
                    let taskPage;
                    try {
                        taskPage = await browser.newPage();
                        await humanizePage(taskPage);
                        // Owner Listings (High Priority)
                        const ownerFilter = scraperConfig.ownerFilters?.hepsiemlak || 'sahibinden=true';
                        const ownerUrl = cat.hepsiemlak + (cat.hepsiemlak.includes('?') ? '&' : '?') + ownerFilter;
                        const listingsOwn = await scrapeHepsiemlak(taskPage, ownerUrl, 'owner', cat.category, [1, 2], null, cat.type);
                        totalListingsScraped += (listingsOwn?.length || 0);

                        // General Market
                        const pages = await getPageRange('hepsiemlak', cat.category, cat.type);
                        const listingsGen = await scrapeHepsiemlak(taskPage, cat.hepsiemlak, null, cat.category, pages, null, cat.type);
                        totalListingsScraped += (listingsGen?.length || 0);
                    } catch (e) { console.error(`Hepsiemlak ${cat.name} failed:`, e.message); }
                    finally { if (taskPage) await taskPage.close(); }
                }));

                await Promise.all(tasks);
                await markRemovedListings('hepsiemlak');
                console.log('✅ Hepsiemlak Scrape Finished.');
            })());
        }

        // 3. EMLAKJET TASK
        if (provider === 'all' || provider === 'emlakjet') {
            portalTasks.push((async () => {
                console.log('⚡ Starting Parallel Emlakjet Scrape...');
                const limit = pLimit(2);

                const tasks = CATEGORIES.map(cat => limit(async () => {
                    let taskPage;
                    try {
                        taskPage = await browser.newPage();
                        await humanizePage(taskPage);
                        // Owner Listings (High Priority)
                        const ownerFilter = scraperConfig.ownerFilters?.emlakjet || 'listing_owner=individual';
                        const ownerUrl = cat.emlakjet + (cat.emlakjet.includes('?') ? '&' : '?') + ownerFilter;
                        const listingsOwn = await scrapeEmlakjet(taskPage, ownerUrl, 'owner', cat.category, [1, 2], cat.type);
                        totalListingsScraped += (listingsOwn?.length || 0);

                        // General Market
                        const pages = await getPageRange('emlakjet', cat.category, cat.type);
                        const listingsGen = await scrapeEmlakjet(taskPage, cat.emlakjet, null, cat.category, pages, cat.type);
                        totalListingsScraped += (listingsGen?.length || 0);
                    } catch (e) { console.error(`Emlakjet ${cat.name} failed:`, e.message); }
                    finally { if (taskPage) await taskPage.close(); }
                }));

                await Promise.all(tasks);
                await markRemovedListings('emlakjet');
                console.log('✅ Emlakjet Scrape Finished.');
            })());
        }

        // Await all portal tracks
        await Promise.all(portalTasks);
        console.log('\n🏁 ALL PORTALS COMPLETED PARALLEL SYNC.');

        // Overall Performance Summary
        const scrapeEndTime = Date.now();
        const totalDuration = (scrapeEndTime - scrapeStartTime) / 1000;
        const overallLPM = totalDuration > 0 ? (totalListingsScraped / totalDuration * 60).toFixed(2) : 0;

        console.log(`\n${'='.repeat(70)}`);
        console.log(`🎉 OVERALL SCRAPING JOB COMPLETED`);
        console.log(`   Provider: ${provider}`);
        console.log(`   Total Duration: ${(totalDuration / 60).toFixed(2)} minutes`);
        console.log(`   Total Listings: ${totalListingsScraped}`);
        console.log(`   Overall LPM: ${overallLPM}`);
        console.log(`${'='.repeat(70)}\n`);

        // Save cookies after success
        console.log('💾 Saving Fresh Cookies...');
        await saveBrowserState(page);

        if (sessionManager) {
            sessionManager.addEvent(`Scraping tamamlandı: ${totalListingsScraped} ilan, ${(totalDuration / 60).toFixed(1)} dakika`, 'success');
        }

    } catch (error) {
        console.error('Global Scraper Error:', error);
        // Save cookies even on error (might have passed block)
        if (page) {
            console.log('💾 Saving Cookies (Error Recover)...');
            try { await saveBrowserState(page); } catch (e) { }
        }
    } finally {
        /* Browser stays open for inspection in manual mode, or closed by process.exit */
    }
}

async function syncPortfolio(injectedPage = null) {
    console.log('🔄 Starting Manual Portfolio Sync (Office Listings Only)...');
    const { getSessionManager } = require('./sessionManager');
    const sessionMgr = getSessionManager();
    sessionMgr.addEvent('Portföy senkronizasyonu başlatılıyor...', 'info');

    let browser, page;
    try {
        if (injectedPage) {
            page = injectedPage;
            browser = page.browser();
            // Ensure enhanced behavior on injected page
            await addEnhancedHumanBehavior(page);
        } else {
            // ===== ENHANCED BROWSER LAUNCH FOR SYNC =====
            console.log('🚀 Launching Enhanced Browser for Portfolio Sync...');
            const enhanced = await getFullyEnhancedBrowser();
            browser = enhanced.browser;
            page = enhanced.page;

            console.log('✅ Enhanced Sync Browser Ready');
        }

        const { scrapeSahibindenStealth, scrapeSahibindenTeam } = require('./stealthScraper');

        // 1. TEAM SYNC
        if (scraperConfig.agencyStore?.url) {
            console.log('👥 Syncing Team Page...');
            try {
                const teamUrl = scraperConfig.agencyStore.url.replace(/\/$/, '') + '/ekibimiz';
                const teamMembers = await scrapeSahibindenTeam(teamUrl, page);
                for (const member of teamMembers) {
                    await findOrCreateConsultant(member.name, member.phone, member.img);
                }
            } catch (err) { console.error('❌ Team Sync Failed:', err.message); }
        }

        // 2. SAHIBINDEN STORE SYNC
        if (scraperConfig.agencyStore?.url) {
            console.log('🌟 Syncing Sahibinden Agency Store...');
            const sessionMgr = getSessionManager();
            sessionMgr.addEvent('Sahibinden Ofis: Portföy senkronizasyonu başlatıldı...', 'info', 'sahibinden');
            try {
                const storeUrl = scraperConfig.agencyStore.url;
                const storeListings = await scrapeSahibindenStealth(storeUrl, 'office', 'store', [1, 2, 3], page);
                const validListings = [];
                for (const l of storeListings) {
                    let assignedId = scraperConfig.agencyStore.assignedUserId;
                    if (l.seller_name && l.seller_name.length > 3 && !l.seller_name.toLowerCase().includes('emlak')) {
                        try {
                            const consultantId = await findOrCreateConsultant(l.seller_name);
                            if (consultantId) assignedId = consultantId;
                        } catch (e) { }
                    }
                    validListings.push({ ...l, assigned_user_id: assignedId, is_primary: true });
                }
                if (validListings.length > 0) {
                    await saveListings(validListings);
                    sessionMgr.addEvent(`Sahibinden Ofis: ${validListings.length} ilan güncellendi.`, 'success', 'sahibinden');
                }
            } catch (err) {
                console.error('❌ Sahibinden Store Sync Failed:', err.message);
                sessionMgr.addEvent(`Sahibinden Ofis Hatası: ${err.message}`, 'error', 'sahibinden');
            }
        }

        // 3. HEPSIEMLAK STORE SYNC
        if (scraperConfig.agencyStore?.hepsiemlak_url) {
            console.log('🌟 Syncing Hepsiemlak Store...');
            const sessionMgr = getSessionManager();
            sessionMgr.addEvent('Hepsiemlak Ofis: Senkronizasyon başlatıldı...', 'info', 'hepsiemlak');
            try {
                // First Sync individual consultants if URLs available
                if (scraperConfig.agencyStore.hepsiemlak_consultants && scraperConfig.agencyStore.hepsiemlak_consultants.length > 0) {
                    for (const consultant of scraperConfig.agencyStore.hepsiemlak_consultants) {
                        console.log(`👤 Syncing Hepsiemlak Store for: ${consultant.name}`);
                        sessionMgr.addEvent(`Hepsiemlak: ${consultant.name} portföyü senkronize ediliyor...`, 'info', 'hepsiemlak');
                        await scrapeHepsiemlak(page, consultant.url, 'office', 'store', [1, 2], {
                            consultantName: consultant.name,
                            isPrimary: true
                        });
                        await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
                    }
                }

                // THEN ALWAYS SYNC MAIN OFFICE PAGE (Coverage check to catch unassigned or missing listings)
                console.log('🏛️ Syncing Main Hepsiemlak Office Page for Coverage...');
                sessionMgr.addEvent('Hepsiemlak: Ofis ana sayfası taranıyor...', 'info', 'hepsiemlak');
                const storeUrl = scraperConfig.agencyStore.hepsiemlak_url;
                await scrapeHepsiemlak(page, storeUrl, 'office', 'store', [1, 2, 3], {
                    assignedUserId: scraperConfig.agencyStore.assignedUserId || 3,
                    isPrimary: true
                });
            } catch (err) {
                console.error('❌ Hepsiemlak Store Sync Failed:', err.message);
                sessionMgr.addEvent(`Hepsiemlak Ofis Hatası: ${err.message}`, 'error', 'hepsiemlak');
            }
        }

        console.log('✅ Manual Portfolio Sync Completed.');
        return { success: true };

    } catch (error) {
        console.error('Portfolio Sync Error:', error);
        return { success: false, error: error.message };
    } finally {
        if (browser && !injectedPage) {
            await browser.disconnect();
        }
    }
}

// The library handles Turnstile automatically, so this function is now just a verification/backup
// Polling-based robust solver
async function solveCloudflareChallenge(page) {
    console.log('🛡️ Cloudflare/Block check active...');

    const blockIndicators = [
        'Just a moment', 'Bir dakika', 'Attention Required',
        'Olağan dışı', 'Unusual activity', 'Verify you are human',
        'Access Denied', 'Forbidden', 'Robot Değilim', 'Güvenlik Kontrolü'
    ];

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5s interval)

    while (attempts < maxAttempts) {
        try {
            const title = await page.title();
            const content = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');

            const isBlocked = blockIndicators.some(ind =>
                title.includes(ind) || content.includes(ind)
            );

            if (!isBlocked) {
                if (attempts > 0) console.log(`✅ Challenge/Block passed after ${attempts} attempts!`);
                return true;
            }

            if (attempts % 6 === 0) { // Every 30s
                console.log(`⏳ Waiting for bypass... Status: ${title}`);
                // Simulate minor interaction to stay alive
                try {
                    await page.mouse.move(Math.random() * 500, Math.random() * 500);
                } catch (e) { }
            }

            await new Promise(r => setTimeout(r, 5000));
            attempts++;
        } catch (e) {
            await new Promise(r => setTimeout(r, 5000));
            attempts++;
        }
    }

    console.warn('❌ Timeout waiting for challenge solution.');
    return false;
}


async function scrapeHepsiemlak(page, url, forcedSellerType = null, category = 'residential', targetPages = [1, 2, 3], assignmentOverride = null, listingType = 'sale') {
    console.log(`--- Scraping Hepsiemlak (${url}) [Type: ${listingType}, Pages: ${targetPages.join(', ')}] ---`);
    const sessionMgr = getSessionManager();
    sessionMgr.addEvent(`Hepsiemlak: Tarama başlatıldı [${listingType} - ${category}]`, 'info', 'hepsiemlak');
    let allListings = [];

    for (const pageNum of targetPages) {
        // ... navigation logic ...
        const pageSize = scraperConfig.pagination?.hepsiemlak || 24;
        const pageUrl = `${url}?page=${pageNum}&pageSize=${pageSize}`;
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

                // Scrape items using attribute-based selectors
                const listings = await page.evaluate((forcedSellerType, category, lType) => {
                    const items = document.querySelectorAll('.listing-item, .card-link, [class*="listing-card"]');
                    const data = [];

                    items.forEach(item => {
                        // 1. LINK & ID EXTRACTION
                        const clicker = item.querySelector('.card-link-clicker') || item.querySelector('a');
                        if (!clicker) return;

                        const url = 'https://www.hepsiemlak.com' + (clicker.getAttribute('href') || '');
                        let id = item.getAttribute('data-id') || item.id;

                        // Extract ID from URL if missing (e.g. /...-12345678)
                        if (!id || id.length < 5) {
                            const match = url.match(/-(\d+)$/);
                            if (match) id = match[1];
                        }

                        if (!id || id.length < 5) {
                            const idEl = item.querySelector('.phone-listing-id');
                            if (idEl) id = idEl.innerText.replace(/[^\d-]/g, '').trim();
                        }

                        if (!id || id.length < 5) return;

                        // 2. TITLE (Attribute-based)
                        let title = clicker.getAttribute('title') || 'İsimsiz İlan';

                        // 3. PRICE
                        const priceEl = item.querySelector('.list-price, .price, [class*="price"]');
                        let price = 0;
                        if (priceEl) {
                            const raw = priceEl.innerText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                            price = parseFloat(raw) || 0;
                        }

                        // 4. LOCATION
                        const locationEl = item.querySelector('.list-view-location');
                        let district = '';
                        let neighborhood = '';
                        if (locationEl) {
                            const parts = locationEl.innerText.split('/').map(s => s.trim());
                            if (parts.length > 1) district = parts[1];
                            if (parts.length > 2) {
                                neighborhood = parts[2].replace(/\s+Mah\.?/i, '').replace(/\s+Mahallesi/i, '').trim() + ' Mah.';
                            }
                        }


                        // STRICT GEOGRAPHY FILTER
                        const isAyvalik = district && (district.toLocaleLowerCase('tr-TR').includes('ayvalık') || district.toLowerCase().includes('ayvalik'));

                        if (!isAyvalik) {
                            return;
                        }

                        // 5. LISTING DETAILS (Size, Rooms, Type)
                        let size_m2 = 0;
                        let rooms = '';
                        const categoryEl = item.querySelector('.list-view-category');
                        if (categoryEl) {
                            const spans = Array.from(categoryEl.querySelectorAll('span')).map(s => s.innerText);
                            spans.forEach(val => {
                                if (val.includes('m²')) {
                                    size_m2 = parseInt(val.replace(/[^\d]/g, '')) || 0;
                                } else if (val.match(/\d+\s*\+\s*\d+/)) {
                                    rooms = val.replace(/[^\s\d+]/g, '').replace(/\s/g, '').trim();
                                }
                            });
                        }

                        // 6. DATE
                        const dateEl = item.querySelector('.list-view-date') || item.querySelector('[class*="date"]');
                        let listing_date = null;
                        if (dateEl) {
                            const dateText = dateEl.innerText.trim();
                            const parts = dateText.match(/(\d{2})-(\d{2})-(\d{4})/);
                            if (parts) { listing_date = `${parts[3]}-${parts[2]}-${parts[1]}`; }
                            else if (dateText.toLowerCase().includes('bugün')) { listing_date = new Date().toISOString().split('T')[0]; }
                            else if (dateText.toLowerCase().includes('dün')) {
                                const d = new Date(); d.setDate(d.getDate() - 1);
                                listing_date = d.toISOString().split('T')[0];
                            }
                        }

                        const itemData = {
                            external_id: id,
                            title,
                            price,
                            url,
                            district,
                            neighborhood,
                            rooms,
                            size_m2,
                            listing_date,
                            seller_type: forcedSellerType || 'office',
                            seller_name: 'Bilinmiyor',
                            listing_type: url.includes('kiralik') ? 'rent' : (url.includes('satilik') ? 'sale' : lType),
                            category
                        };

                        // 7. TITLE FALLBACK (Description-based or Pattern-based)
                        if (!title || title === 'İsimsiz İlan' || title === 'No Title') {
                            itemData.title = generatePropertyTitle(itemData);
                        }

                        data.push(itemData);
                    });
                    return data;
                }, forcedSellerType, category, listingType);

                // Inject Overrides
                const processedListings = [];
                for (const l of listings) {
                    let assignedId = assignmentOverride ? assignmentOverride.assignedUserId : null;

                    // If we have a consultant name, try to find/match their ID
                    if (assignmentOverride?.consultantName) {
                        try {
                            assignedId = await findOrCreateConsultant(assignmentOverride.consultantName);
                        } catch (e) {
                            console.warn(`⚠️ Failed to resolve consultant ID for ${assignmentOverride.consultantName}: ${e.message}`);
                        }
                    }

                    processedListings.push({
                        ...l,
                        assigned_user_id: assignmentOverride ? (assignedId || 3) : null,
                        is_primary: assignmentOverride ? assignmentOverride.isPrimary : false
                    });
                }

                if (processedListings.length === 0) {
                    console.log(`ℹ️ Page ${pageNum} returned no listings. Ending pagination for this category.`);
                    const sessionManager = getSessionManager();
                    sessionManager.trackRequest(true, 'hepsiemlak');
                    // Return what we have so far, effectively stopping further pages
                    return allListings;
                } else {
                    // Check Duplicates ...
                    const newIds = processedListings.map(l => l.external_id);
                    // ...
                    console.log(`Found ${processedListings.length} listings. Saving progress...`);
                    const sessionManager = getSessionManager();
                    sessionManager.trackRequest(true, 'hepsiemlak');
                    sessionManager.trackListings('hepsiemlak', processedListings.length);
                    sessionManager.addEvent(`Hepsiemlak: Sayfa ${pageNum} taranıdı, ${processedListings.length} ilan alındı.`, 'info', 'hepsiemlak');
                    await saveListings(processedListings);

                    // Standardized Cookie Persistence
                    await saveBrowserState(page);

                    allListings = [...allListings, ...processedListings];
                }
                pageSuccess = true;
            } catch (e) {
                // ...
                retryCount++;
            }
        }
    }
    if (allListings.length > 0) {
        sessionMgr.addEvent(`Hepsiemlak: Tarama tamamlandı, toplam ${allListings.length} ilan alındı.`, 'success', 'hepsiemlak');
    }
    return allListings;
}

async function saveListings(listings) {
    if (listings.length === 0) return { newCount: 0, updateCount: 0 };
    console.log(`Saving ${listings.length} listings to DB...`);

    // Lazy load dependencies to avoid circular deps if any, though standard requires are fine here
    const { sendMatchNotification, sendNewListingNotification } = require('./notificationService');
    const { groupProperty } = require('./deduplicationService');
    const { checkOpportunity } = require('./analyticsService');
    const { findMatchesForProperty } = require('./matchingService');
    const sessionMgr = require('./sessionManager').getSessionManager();

    // 1. Bulk Fetch Existing Properties
    const externalIds = listings.map(l => l.external_id);
    const existingProperties = await prisma.property.findMany({
        where: { external_id: { in: externalIds } }
    });
    const existingMap = new Map(existingProperties.map(p => [p.external_id, p]));

    const operations = [];
    const createOpIndices = [];
    let updateCount = 0;

    // 2. Prepare Operations
    for (const item of listings) {
        const { external_id, title, price, url, district, neighborhood, rooms, size_m2, listing_date, listing_type, category, seller_type, seller_name, assigned_user_id, is_primary } = item;
        const existingProp = existingMap.get(external_id);

        if (existingProp) {
            // Update Logic
            const updateData = { last_scraped: new Date(), status: 'active' };

            // Fix existing generic titles if we encounter them during sync
            if (!existingProp.title || existingProp.title === 'İsimsiz İlan' || existingProp.title === 'No Title') {
                updateData.title = title && title !== 'İsimsiz İlan' && title !== 'No Title' ? title : generatePropertyTitle(item);
            }

            if (assigned_user_id) updateData.assigned_user_id = assigned_user_id;
            if (is_primary !== undefined) updateData.is_primary = is_primary;

            // Price History Check
            if (parseFloat(existingProp.price) !== parseFloat(price)) {
                operations.push(prisma.propertyHistory.create({
                    data: {
                        property_id: existingProp.id,
                        price: price,
                        change_type: parseFloat(price) < parseFloat(existingProp.price) ? 'price_decrease' : 'price_increase'
                    }
                }));
            }

            updateData.price = price;
            operations.push(prisma.property.update({
                where: { id: existingProp.id },
                data: updateData
            }));
            updateCount++;
        } else {
            // Create Logic
            const finalTitle = (!title || title === 'İsimsiz İlan' || title === 'No Title')
                ? generatePropertyTitle(item)
                : title;

            operations.push(prisma.property.create({
                data: {
                    external_id, title: finalTitle, price, url, district, neighborhood, rooms, size_m2,
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
            }));
            createOpIndices.push(operations.length - 1);
        }
    }

    // 3. Execute Batch Transaction
    let createdProperties = [];
    if (operations.length > 0) {
        try {
            const results = await prisma.$transaction(operations);
            createdProperties = createOpIndices.map(i => results[i]);
        } catch (err) {
            console.error('Batch Transaction Failed:', err);
            // Fallback? Or just rethrow. For now, log.
            return { newCount: 0, updateCount: 0, error: err.message };
        }
    }

    const newCount = createdProperties.length;

    // 4. Post-Processing for Creates (Notifications & AI)
    // We run these in parallel chunks to speed up but not overwhelm resources
    if (newCount > 0) {
        console.log(`Processing ${newCount} new properties (Notifications & Analysis)...`);
        const processNewProperty = async (newProp) => {
            try {
                await groupProperty(newProp.id);
                await checkOpportunity(newProp);
                const matches = await findMatchesForProperty(newProp);

                // Process high-quality matches
                for (const match of matches) {
                    if (match.match_quality >= 80) {
                        try {
                            await prisma.clientProperty.create({
                                data: { client_id: match.client.id, property_id: newProp.id, status: 'concierge', notes: `Otomatik Eşleşme (%${match.match_quality})` }
                            });
                            await sendMatchNotification(match.client, newProp, match.match_quality);
                        } catch (matchErr) {
                            // Ignore unique constraint errors or similar on match save
                        }
                    }
                }

                await sendNewListingNotification(newProp);
            } catch (innerErr) {
                console.error(`Post-processing failed for prop ${newProp.id}:`, innerErr.message);
            }
        };

        // Run sequentially or small batches if too many
        // For 50, parallel Promise.all is likely fine, but let's be safe with a map
        await Promise.all(createdProperties.map(p => processNewProperty(p)));
    }

    if (newCount > 0 || updateCount > 0) {
        sessionMgr.addEvent(`Veritabanı: ${newCount} yeni ilan eklendi, ${updateCount} ilan güncellendi.`, 'success');
    }

    return { newCount, updateCount };
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

async function scrapeEmlakjet(page, url, forcedSellerType = null, category = 'residential', targetPages = [1, 2, 3], listingType = 'sale') {
    console.log(`--- Scraping Emlakjet (${url}) [Type: ${listingType}, Pages: ${targetPages.join(', ')}] ---`);
    const sessionMgr = getSessionManager();
    sessionMgr.addEvent(`Emlakjet: Tarama başlatıldı [${listingType} - ${category}]`, 'info', 'emlakjet');
    let allListings = [];

    for (const pageNum of targetPages) {
        const pageSize = scraperConfig.pagination?.emlakjet || 20;
        // Emlakjet typically uses path-based pagination /2, /3 etc.
        // We attempt to append a query param if supported, otherwise just use standard path.
        // Known pattern: /satilik-daire/balikesir-ayvalik/2?size=50 (experimental)
        let pageUrl = pageNum === 1 ? url : `${url}${pageNum}`;

        // Append size param if not present
        if (!pageUrl.includes('?')) {
            pageUrl += `?size=${pageSize}`;
        } else {
            pageUrl += `&size=${pageSize}`;
        }

        console.log(`Navigating to Emlakjet Page ${pageNum}: ${pageUrl}`);

        try {
            // Check if page is still attached before navigation
            if (page.isClosed()) {
                console.log('⚠️ Page was closed, stopping Emlakjet scraping');
                break;
            }

            await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: scraperConfig.timeouts.pageLoad });

            try {
                await page.waitForSelector('a[class*="styles_wrapper__"]', { timeout: scraperConfig.timeouts.element });
            } catch (e) {
                console.log(`⚠️ Timeout waiting for Emlakjet listings on page ${pageNum}. Ending pagination.`);
                break;
            }

            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

            // Check if page is still attached before evaluate
            if (page.isClosed()) {
                console.log('⚠️ Page was closed during wait, stopping');
                break;
            }

            let listings;
            try {
                listings = await page.evaluate((category, forcedType, lType) => {
                    const items = document.querySelectorAll('a[class*="styles_wrapper__"]');
                    const data = [];

                    items.forEach(item => {
                        const titleEl = item.querySelector('h3');
                        const spans = Array.from(item.querySelectorAll('span'));
                        const priceEl = spans.find(s => s.innerText.includes('TL'));
                        const locationEl = spans.find(s => s.innerText.toLocaleLowerCase('tr-TR').includes('ayvalık') || s.innerText.toLowerCase().includes('ayvalik'));
                        const detailsEl = Array.from(item.querySelectorAll('div')).find(s => s.innerText.includes('m²'));

                        if (!titleEl || !priceEl || !locationEl) return;

                        const locationStr = locationEl.innerText.toLocaleLowerCase('tr-TR');
                        if (!locationStr.includes('ayvalık') && !locationStr.includes('ayvalik')) {
                            return; // Strict filter
                        }

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

                        // Seller Type Detection
                        const officeNameEl = item.querySelector('div[class*="styles_officeName__"]');
                        const badgeEl = item.querySelector('div[class*="styles_tagWrapper__"]');

                        let seller_type = forcedType || 'office';
                        let seller_name = 'Emlak Ofisi';

                        if (forcedType === 'owner') {
                            seller_name = 'Sahibinden';
                            seller_type = 'owner';
                        } else if (officeNameEl) {
                            seller_name = officeNameEl.innerText.trim();
                            seller_type = 'office';
                        } else if (badgeEl && badgeEl.innerText.includes('Sahibinden')) {
                            seller_name = 'Sahibinden';
                            seller_type = 'owner';
                        } else {
                            seller_name = 'Bireysel / Sahibinden';
                            seller_type = 'owner';
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
                            seller_type,
                            seller_name,
                            listing_type: url.includes('kiralik') ? 'rent' : (url.includes('satilik') ? 'sale' : lType),
                            category
                        });
                    });
                    return data;
                }, category, forcedSellerType, listingType);
            } catch (evalError) {
                // Handle detached frame error
                if (evalError.message.includes('detached') || evalError.message.includes('Execution context')) {
                    console.log(`⚠️ Page detached during evaluation on page ${pageNum}. Skipping to next page.`);
                    continue;
                }
                throw evalError;
            }

            if (listings && listings.length > 0) {
                console.log(`Found ${listings.length} listings on page ${pageNum}. Saving progress...`);
                sessionMgr.trackRequest(true, 'emlakjet');
                sessionMgr.trackListings('emlakjet', listings.length);
                sessionMgr.addEvent(`Emlakjet: Sayfa ${pageNum} tarandı, ${listings.length} ilan alındı.`, 'info', 'emlakjet');
                await saveListings(listings);
                allListings = [...allListings, ...listings];
            } else {
                console.log(`⚠️ No listings found on page ${pageNum}. Ending pagination.`);
                break;
            }
        } catch (err) {
            console.error(`Emlakjet Page ${pageNum} Error:`, err.message);
            // Continue to next page instead of breaking
            if (scraperConfig.retry?.continueOnPageFailure) {
                console.log(`⚠️ Continuing to next page after error...`);
                continue;
            } else {
                break;
            }
        }

        // Delay between pages
        if (targetPages.indexOf(pageNum) < targetPages.length - 1) {
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
        }
    }

    if (allListings.length > 0) {
        sessionMgr.addEvent(`Emlakjet: Tarama tamamlandı, toplam ${allListings.length} ilan alındı.`, 'success', 'emlakjet');
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
async function scrapeDetails(url, existingPage = null) {
    if (url.includes('sahibinden.com')) return await scrapeSahibindenDetails(url, existingPage);

    // EMLAKJET LOGIC
    if (url.includes('emlakjet.com')) {
        console.log(`--- Scraping Emlakjet Details (${url}) ---`);
        let browser, page;
        try {
            if (existingPage) {
                page = existingPage;
            } else {
                const { getOrLaunchBrowser } = require('./stealthScraper');
                browser = await getOrLaunchBrowser();
                page = await browser.newPage();
                await page.setViewport({ width: 1366, height: 768 });
            }

            // Humanize
            const { humanizePage } = require('./browserFactory');
            await humanizePage(page);

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const data = await page.evaluate(() => {
                const isRemoved = document.body.innerText.includes('Bu ilan yayından kaldırılmıştır') ||
                    document.body.innerText.includes('İlan Yayında Değil') ||
                    document.querySelector('.listing-not-active');

                if (isRemoved) return { isRemoved: true };

                const description = document.querySelector('#aciklama .desc')?.innerText.trim() ||
                    document.querySelector('.description')?.innerText.trim() || '';

                // Images - Try to get high res
                const images = [];
                document.querySelectorAll('.gallery-container img, .swiper-slide img, .image-gallery-slide img').forEach(img => {
                    let src = img.src || img.getAttribute('data-src');
                    // Emlakjet often adds resizing params, remove them for full quality if possible, 
                    // or ensure we aren't getting tiny thumbs.
                    // Example: https://cdn.emlakjet.com/.../resize/800/600/
                    if (src) {
                        // Attempt to upgrade to higher res if specific pattern found (optional, tricky with EJ cdn)
                        // For now just collecting what's there
                        images.push(src);
                    }
                });

                const features = [];
                document.querySelectorAll('.feature-item, .features-column li').forEach(i => features.push(i.innerText.trim()));

                // Structured Info Extraction
                const infoMap = {};
                // Strategy 1: Table rows
                document.querySelectorAll('div[class*="styles_tableRow__"]').forEach(row => {
                    const label = row.querySelector('div:first-child')?.innerText.trim();
                    const value = row.querySelector('div:last-child')?.innerText.trim();
                    if (label && value) infoMap[label] = value;
                });

                // Strategy 2: Generic list items (fallback)
                if (Object.keys(infoMap).length === 0) {
                    document.querySelectorAll('ul.info-list li, .properties-list li').forEach(li => {
                        const parts = li.innerText.split(':');
                        if (parts.length > 1) {
                            infoMap[parts[0].trim()] = parts.slice(1).join(':').trim();
                        }
                    });
                }

                // Seller Info
                const sellerName = document.querySelector('div[class*="styles_officeName__"]')?.innerText.trim() ||
                    document.querySelector('.seller-name')?.innerText.trim() || 'Bilinmiyor';

                // Phone is often hidden behind button, but sometimes visible or in scripts. 
                // We'll capture what's visible or common selector.
                const sellerPhone = document.querySelector('a[href^="tel:"]')?.href.replace('tel:', '') || null;

                return {
                    description,
                    images: [...new Set(images)],
                    features,
                    seller_name: sellerName,
                    seller_phone: sellerPhone,
                    building_age: infoMap['Bina Yaşı'] || null,
                    heating_type: infoMap['Isıtma Tipi'] || infoMap['Isınma Tipi'] || null,
                    floor_location: infoMap['Bulunduğu Kat'] || null,
                    size_m2: parseInt(infoMap['Brüt Metrekare'] || infoMap['Metrekare'] || 0),
                    rooms: infoMap['Oda Sayısı'] || null,
                    isRemoved: false
                };
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
            if (browser && !existingPage) await browser.close();
            else if (page && !existingPage) await page.close();
        }
    }

    // HEPSIEMLAK LOGIC
    console.log(`--- Scraping Hepsiemlak Details (${url}) ---`);
    let browser, page;
    try {
        if (existingPage) {
            page = existingPage;
        } else {
            const { getOrLaunchBrowser } = require('./stealthScraper');
            browser = await getOrLaunchBrowser();
            page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
        }

        const { humanizePage } = require('./browserFactory');
        await humanizePage(page);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await solveCloudflareChallenge(page);

        const data = await page.evaluate(() => {
            const removedMsg = document.querySelector('.listing-removed-message') ||
                document.querySelector('.no-listing-content') ||
                document.body.innerText.includes('Bu ilan yayında değildir') ||
                document.body.innerText.includes('yayından kaldırılmıştır');

            if (removedMsg) return { isRemoved: true };

            const description = document.querySelector('.description-content')?.innerText.trim() ||
                document.querySelector('#description')?.innerText.trim() || '';

            let images = [];
            // Target all possible image containers, prioritizing full-res sources
            const imgSelectors = [
                '.detail-gallery img',
                '.img-wrapper img',
                '.swiper-wrapper img',
                '.fancy-gallery img',
                '.he-gallery-image'
            ];

            document.querySelectorAll(imgSelectors.join(', ')).forEach(img => {
                let src = img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.src;
                if (src && !src.startsWith('data:image')) {
                    // Hepsiemlak: Remove mnresize to get full original resolution
                    if (src.includes('/mnresize/')) {
                        src = src.replace(/\/mnresize\/\d+\/\d+\//, '/');
                    }
                    images.push(src);
                }
            });

            images = [...new Set(images)];

            const features = [];
            document.querySelectorAll('.spec-item, .feature-item, .uiBox li').forEach(item => {
                const text = item.innerText.trim().replace(/\n/g, ': ');
                if (text && text.length > 2) features.push(text);
            });

            const infoMap = {};
            document.querySelectorAll('.spec-item, .classifiedInfoList li').forEach(item => {
                const label = (item.querySelector('.spec-item-label') || item.querySelector('strong'))?.innerText.trim();
                const value = (item.querySelector('.spec-item-value') || item.querySelector('span'))?.innerText.trim();
                if (label && value) infoMap[label] = value;
            });

            return {
                description,
                images,
                features,
                seller_name: document.querySelector('.firm-card-name')?.innerText.trim() ||
                    document.querySelector('.username-info-area')?.innerText.trim() || 'Bilinmiyor',
                seller_phone: document.querySelector('.phone-number')?.innerText.trim() ||
                    document.querySelector('.pretty-phone-part')?.innerText.trim() || null,
                building_age: infoMap['Bina Yaşı'] || null,
                heating_type: infoMap['Isınma Tipi'] || infoMap['Isıtma'] || null,
                floor_location: infoMap['Bulunduğu Kat'] || null,
                size_m2: parseInt(infoMap['Brüt Metrekare'] || infoMap['Metrekare'] || infoMap['m² (Brüt)'] || 0),
                rooms: infoMap['Oda + Salon Sayısı'] || infoMap['Oda Sayısı'] || null,
                isRemoved: false
            };
        });

        if (data.isRemoved) {
            console.log(`⚠️ Listing REMOVED detected: ${url}`);
            const error = new Error('ListingRemoved');
            error.code = 'LISTING_REMOVED';
            throw error;
        }

        return data;

    } catch (e) {
        console.error('Hepsiemlak Detail Scrape Error:', e.message);
        throw e;
    } finally {
        if (browser && !existingPage) await browser.close();
        else if (page && !existingPage) await page.close();
    }
}

async function markRemovedListings(provider = null) {
    console.log(`--- Detecting removed listings for provider: ${provider || 'ALL'} ---`);

    // Threshold: Not updated in the last 12 hours
    const threshold = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const where = {
        status: 'active',
        last_scraped: { lt: threshold },
        seller_type: { not: 'office' } // PORTFOLIO PROTECTION: Don't auto-remove office listings by time
    };

    if (provider) {
        if (provider === 'sahibinden') where.url = { contains: 'sahibinden.com' };
        if (provider === 'hepsiemlak') where.url = { contains: 'hepsiemlak.com' };
        if (provider === 'emlakjet') where.url = { contains: 'emlakjet.com' };
    }

    const removedListings = await prisma.property.findMany({
        where,
        select: { id: true, group_id: true, is_primary: true }
    });

    console.log(`🧹 Mark as Removed: Found ${removedListings.length} stale listings.`);

    if (removedListings.length > 0) {
        for (const p of removedListings) {
            await prisma.property.update({
                where: { id: p.id },
                data: { status: 'removed' }
            });

            // If a PRIMARY listing is removed, we must check if there is another ACTIVE listing in the same group to promote
            if (p.is_primary && p.group_id) {
                const nextActive = await prisma.property.findFirst({
                    where: {
                        group_id: p.group_id,
                        status: 'active',
                        id: { not: p.id }
                    },
                    orderBy: { created_at: 'asc' }
                });

                if (nextActive) {
                    console.log(`🔄 Promoting listing ${nextActive.id} to primary in group ${p.group_id} (Reason: Primary ${p.id} removed)`);
                    await prisma.property.update({
                        where: { id: nextActive.id },
                        data: { is_primary: true }
                    });

                    // Also demote the old primary explicitly just in case
                    await prisma.property.update({
                        where: { id: p.id },
                        data: { is_primary: false }
                    });
                }
            }
        }
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

// Helper: Find or Create Consultant by Name and map it to a user account
async function findOrCreateConsultant(fullName, phone = '', imageUrl = null) {
    if (!fullName) return null;

    // Normalize name for search
    const nameMatch = await prisma.user.findFirst({
        where: {
            name: { contains: fullName.trim(), mode: 'insensitive' }
        }
    });

    if (nameMatch) return nameMatch.id;

    // Create a slug for email
    const slug = fullName.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '.');

    const email = `${slug}@trioapp.com`;

    // Check email uniqueness
    const emailMatch = await prisma.user.findUnique({ where: { email } });
    if (emailMatch) return emailMatch.id;

    console.log(`👤 Auto-creating Consultant for Portfolio: ${fullName}`);

    // Hash password "123"
    let hashedPassword = '$2a$10$Metric/Hash/Placeholder'; // Fallback
    try {
        const b = require('bcryptjs');
        hashedPassword = await b.hash('123', 10);
    } catch (e) { console.warn('Bcrypt not found, using placeholder hash'); }

    const newUser = await prisma.user.create({
        data: {
            name: fullName.trim(),
            email: email,
            password_hash: hashedPassword,
            role: 'consultant',
            phone: phone || '',
            profile_picture: imageUrl || null
        }
    });

    return newUser.id;
}

// Comprehensive Portfolio Sync Logic
async function syncPortfolio(injectedPage = null) {
    const fs = require('fs');
    fs.appendFileSync('sync_debug.log', `[${new Date().toISOString()}] 🔄 Service syncPortfolio START\n`);
    console.log('\n' + '='.repeat(70));
    console.log('🔄 --- STARTING MANUAL PORTFOLIO SYNC (OFFICE ONLY) ---');
    console.log('='.repeat(70) + '\n');

    const { scrapeSahibindenStealth, scrapeSahibindenTeam } = require('./stealthScraper');
    const { launchRealBrowser } = require('./realBrowser');

    let browser, page;
    let warning = null;

    try {
        if (injectedPage) {
            console.log('ℹ️ Using Injected Browser Page for Sync');
            page = injectedPage;
            browser = page.browser();
            await addEnhancedHumanBehavior(page);
        } else {
            // Check if Clean Chrome (Port 9222) is active
            try {
                const net = require('net');
                const isPortOpen = await new Promise((resolve) => {
                    const socket = new net.Socket();
                    socket.setTimeout(1000);
                    socket.on('connect', () => { socket.destroy(); resolve(true); });
                    socket.on('timeout', () => { socket.destroy(); resolve(false); });
                    socket.on('error', () => { resolve(false); });
                    socket.connect(9222, '127.0.0.1');
                });

                if (isPortOpen) {
                    console.log('✅ Clean Chrome (Port 9222) is active. Connecting...');
                    const connection = await launchRealBrowser();
                    browser = connection.browser;
                    page = connection.page;
                } else {
                    console.warn('⚠️ Clean Chrome (Port 9222) NOT open. Launching Enhanced Browser...');
                    warning = 'Temiz Chrome Modu (Port 9222) açık değil! Veri eksik gelebilir. En iyi sonuç için "1_CHROME_TEMIZ_MOD_AC.bat" kullanın.';
                    const enhanced = await getFullyEnhancedBrowser();
                    browser = enhanced.browser;
                    page = enhanced.page;
                }
            } catch (e) {
                console.error('Browser initialization failed:', e.message);
                throw e;
            }
        }

        // 1. SYNC SAHIBINDEN TEAM
        console.log('👥 [1/3] Syncing Sahibinden Team Members...');
        const teamUrl = scraperConfig.agencyStore.url.endsWith('/') ? `${scraperConfig.agencyStore.url}ekibimiz` : `${scraperConfig.agencyStore.url}/ekibimiz`;
        const teamMembers = await scrapeSahibindenTeam(teamUrl, page);

        const consultantMap = {}; // name -> id
        if (teamMembers && teamMembers.length > 0) {
            for (const member of teamMembers) {
                const userId = await findOrCreateConsultant(member.name, member.phone, member.img);
                consultantMap[member.name] = userId;
            }
        }

        // 2. SYNC SAHIBINDEN LISTINGS
        console.log('🏠 [2/3] Syncing Sahibinden Agency Store...');
        try {
            const storeListings = await scrapeSahibindenStealth(scraperConfig.agencyStore.url, 'office', 'residential', [1, 2, 3, 4, 5], page);

            // Map with consultant assignment
            const validListings = storeListings.map(l => ({
                ...l,
                assigned_user_id: consultantMap[l.seller_name] || scraperConfig.agencyStore.assignedUserId || 3,
                is_primary: true
            }));

            if (validListings.length > 0) {
                await saveListings(validListings);
                console.log(`✅ Saved ${validListings.length} Sahibinden office listings.`);
            }
        } catch (error) {
            console.error('❌ Sahibinden store sync failed:', error.message);
        }

        // 3. SYNC HEPSIEMLAK STORE
        console.log('🏠 [3/3] Syncing Hepsiemlak Store Listings...');
        try {
            let hepsiemlakCount = 0;
            // 3a. Sync individual consultants if URLs available
            if (scraperConfig.agencyStore.hepsiemlak_consultants && scraperConfig.agencyStore.hepsiemlak_consultants.length > 0) {
                for (const consultant of scraperConfig.agencyStore.hepsiemlak_consultants) {
                    console.log(`👤 Syncing ${consultant.name}'s listings...`);
                    try {
                        const consultantListings = await scrapeHepsiemlak(page, consultant.url, 'office', 'residential', [1, 2], {
                            consultantName: consultant.name,
                            isPrimary: true
                        });
                        hepsiemlakCount += consultantListings.length;
                        await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
                    } catch (err) {
                        console.error(`⚠️ Failed to scrape ${consultant.name}: ${err.message}`);
                    }
                }
            }

            // 3b. Sync main office page for coverage
            console.log('🏛️ Syncing Main Hepsiemlak Office Page for Coverage...');
            const mainHeListings = await scrapeHepsiemlak(page, scraperConfig.agencyStore.hepsiemlak_url, 'office', 'residential', [1, 2, 3, 4, 5], {
                assignedUserId: scraperConfig.agencyStore.assignedUserId || 3,
                isPrimary: true
            });
            hepsiemlakCount += mainHeListings.length;

            console.log(`✅ Synced ${hepsiemlakCount} listings from Hepsiemlak.`);
        } catch (error) {
            console.error('❌ Hepsiemlak store sync failed:', error.message);
        }

        console.log('\n✅ Portfolio Sync Phase Completed.');
        return { success: true, warning };

    } catch (error) {
        console.error('❌ Portfolio Sync Error:', error);
        return { success: false, error: error.message };
    } finally {
        if (browser && !injectedPage) {
            // If it was a real browser connection (9222), disconnect, if fresh, close.
            if (browser.wsEndpoint().includes('127.0.0.1:9222')) {
                await browser.disconnect();
            } else {
                await browser.close();
            }
        }
    }
}

async function saveListings(listings) {
    if (!listings || listings.length === 0) return;

    console.log(`💾 Saving ${listings.length} listings to database...`);

    for (const listing of listings) {
        try {
            // Intelligent Deduplication: Check if this property already exists on another portal
            if (listing.price > 0 && listing.size_m2 > 0 && listing.district) {
                const potentialDuplicate = await prisma.property.findFirst({
                    where: {
                        NOT: { external_id: listing.external_id }, // Don't match itself
                        price: {
                            gte: listing.price * 0.95, // ±5% price margin
                            lte: listing.price * 1.05
                        },
                        size_m2: listing.size_m2,
                        district: listing.district,
                        neighborhood: listing.neighborhood,
                        listing_type: listing.type || listing.listing_type,
                        status: 'active'
                    },
                    select: { id: true, external_id: true, title: true }
                });

                if (potentialDuplicate) {
                    console.log(`🔍 Potential Duplicate Found: ${listing.external_id} looks like ${potentialDuplicate.external_id}`);
                    listing.metadata = {
                        ...(listing.metadata || {}),
                        is_potential_duplicate: true,
                        duplicate_of: potentialDuplicate.id,
                        duplicate_external_id: potentialDuplicate.external_id
                    };
                }
            }

            // Ensure listing_date is a valid Date object to avoid Prisma errors
            if (listing.listing_date) {
                if (typeof listing.listing_date === 'string') {
                    const parsed = new Date(listing.listing_date);
                    if (isNaN(parsed.getTime())) {
                        console.warn(`⚠️ Invalid date string: "${listing.listing_date}" for ${listing.external_id}. Set to null.`);
                        listing.listing_date = null;
                    } else {
                        listing.listing_date = parsed;
                    }
                } else if (listing.listing_date instanceof Date && isNaN(listing.listing_date.getTime())) {
                    console.warn(`⚠️ Invalid Date object for ${listing.external_id}. Set to null.`);
                    listing.listing_date = null;
                }
            }

            // Remove fields that are not in the Prisma schema
            delete listing.location;
            const listingMetadata = listing.metadata; // Preserve for usage if needed, but don't save to root
            delete listing.metadata;

            // Basic deduplication & update logic (existing code)
            const saved = await prisma.property.upsert({
                where: { external_id: listing.external_id },
                update: {
                    ...listing,
                    last_scraped: new Date()
                },
                create: {
                    ...listing,
                    last_scraped: new Date(),
                    created_at: new Date()
                }
            });

            // Trigger AI Refinement if nameless
            if (saved.title === 'İsimsiz İlan' || saved.title?.length < 15) {
                // Run in background
                propertyRefiner.refineProperty(saved.id).catch(err => {
                    console.error('Background refinement failed:', err.message);
                });
            }
        } catch (err) {
            console.error(`Failed to save listing ${listing.external_id}:`, err.message);
        }
    }
}

module.exports = {
    scrapeProperties,
    startScheduler,
    scrapeDetails,
    saveListings,
    markRemovedListings,
    getPageRange,
    findOrCreateConsultant,
    syncPortfolio,
    scrapeSingleListing,
    scrapeEmlakjet,
    scrapeHepsiemlak
};
