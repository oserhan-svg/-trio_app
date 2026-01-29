console.log('%c🤖 TRIO ASSISTANT INJECTED SUCCESSFULLY', 'background: #222; color: #bada55; font-size: 20px; padding: 10px;');
console.log('Extensions Overlay v1.12 Active');

// VISIBILITY HACK: Tricking the browser into keeping JS active even in background tabs
(function visibilityOverride() {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
    Object.defineProperty(document, 'hidden', { value: false, writable: false });

    // Dispatch visibility change event once to trigger any listeners
    document.dispatchEvent(new Event('visibilitychange'));

    // Block focus/blur related JS pausing
    window.addEventListener('blur', (e) => {
        e.stopImmediatePropagation();
        // Force focus back if possible or just prevent the event from being seen
    }, true);
})();

let isCurrentlyScraping = false;

// GLOBAL CONSTANTS
const host = window.location.hostname;
const source = host.includes('sahibinden') ? 'sahibinden' :
    (host.includes('hepsiemlak') || host.includes('hemlak.com')) ? 'hepsiemlak' :
        host.includes('emlakjet') ? 'emlakjet' :
            host.includes('web.whatsapp') ? 'whatsapp' : 'unknown';

async function updateIndicator(text, color = '#4ade80') {
    const div = document.getElementById('trio-indicator') || (() => {
        const d = document.createElement('div');
        d.id = 'trio-indicator';
        d.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:rgba(0,0,0,0.8);color:white;padding:5px 15px;border-radius:20px;font-size:11px;font-weight:900;border:3px solid #4ade80;box-shadow: 0 4px 20px rgba(0,0,0,0.7);display:flex;align-items:center;gap:12px;cursor:pointer;font-family:sans-serif;';

        const textSpan = document.createElement('span');
        textSpan.id = 'trio-text';
        d.appendChild(textSpan);

        const forceBtn = document.createElement('button');
        forceBtn.innerText = 'FORZALA';
        forceBtn.style.cssText = 'background:#ef4444;color:white;border:none;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:black;cursor:pointer;pointer-events:auto;box-shadow:0 2px 4px rgba(0,0,0,0.3);';
        forceBtn.onclick = (e) => {
            e.stopPropagation();
            forceBtn.innerText = '⚡ RESET...';
            isCurrentlyScraping = false; // Override lock
            setTimeout(startOptimizedScrape, 500);
        };
        d.appendChild(forceBtn);

        document.body.appendChild(d);
        return d;
    })();

    const textSpan = div.querySelector('#trio-text');
    if (textSpan) textSpan.innerText = `🤖 ${source.toUpperCase()}: ${text}`;
    div.style.borderColor = color;
    div.style.opacity = '1';
}

// Dispatch READY message to background
chrome.runtime.sendMessage({ action: "ready_to_scrape", source });

// SELF-START LOGIC: If automation is running, don't wait for background to wake us up
// This solves the 'simulation not working' issue on non-Sahibinden portals
(function checkStartNeeded() {
    chrome.storage.local.get(['is_running'], (data) => {
        if (data.is_running && !isCurrentlyScraping) {
            console.log('⚡ Automation detected active. Monitoring for start handshake...');
            updateIndicator('READY (WAITS START)', '#f59e0b');

            // Critical Fallback: If no message from background in 5s, FORCE START
            setTimeout(() => {
                if (!isCurrentlyScraping) {
                    console.warn('🕒 Handshake timeout. FORCE STARTING scraper autonomously...');
                    startOptimizedScrape();
                }
            }, 5000);
        } else {
            updateIndicator('READY (MANUAL)', '#94a3b8');
        }
    });

    if (source === 'whatsapp') {
        console.log('📱 WhatsApp Monitoring Active');
        setInterval(() => {
            if (!isCurrentlyScraping) {
                scrapeWhatsApp();
            }
        }, 5000);
    }
})();

// SPA NAVIGATION MONITOR
// Re-trigger scraping if the URL changes without a full page reload
let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('⚡ SPA URL Change detected:', lastUrl);
        updateIndicator('NAVIGATING...', '#3b82f6');

        // Critical: Reset lock on navigation to ensure next scrape runs
        isCurrentlyScraping = false;

        // Wait for content to settle (Increased to 6s for slow rendering)
        setTimeout(() => {
            console.log('🔄 Restarting scrape for new SPA page...');
            startOptimizedScrape();
        }, 6000);
    }
}, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape_page") {
        if (isCurrentlyScraping) {
            console.log('⏭️ Scraper already active, skipping trigger.');
            return;
        }
        startOptimizedScrape();
    } else if (request.action === "next_page") {
        isCurrentlyScraping = false;
        goToNextPage();
    }
});

async function startOptimizedScrape() {
    isCurrentlyScraping = true;
    await updateIndicator('STABILIZING...', '#6366f1');
    console.log('⏳ Waiting for page stability...');

    // Intelligent Wait: Wait for specific elements based on portal
    const host = window.location.hostname;
    const isSahibinden = host.includes('sahibinden');
    const isHepsi = host.includes('hepsiemlak');
    const isEmlakjet = host.includes('emlakjet');

    const selector = isSahibinden ? '.searchResultsItem, [data-id], .classified-list-item' :
        (isHepsi || host.includes('hemlak.com')) ? '.listing-item, .list-view-item, [class*="listing-card"], .card-link, article[class*="listing"]' :
            isEmlakjet ? 'a[class*="styles_wrapper__"], [class*="listing-item"], [class*="listingItem"], .styles_listingItem__1' : 'body';

    // Anti-Detection: Dismiss Cookie Banners first
    await updateIndicator('OVERLAY CHECK...', '#f59e0b');
    await dismissCookieBanners();

    const ready = await waitForElement(selector, 8000);
    if (!ready) {
        console.warn('⚠️ Page timeout or no listings found.');
        await updateIndicator('NO LISTINGS', '#ef4444');
    }

    // Anti-Detection: Simulate human behavior
    await updateIndicator('SIMULATING...', '#10b981');
    await simulateHumanBehavior();

    // Final check and scrape
    if (source === 'whatsapp') {
        await updateIndicator('SYNCING CHAT...', '#bada55');
        await scrapeWhatsApp();
        isCurrentlyScraping = false;
        return;
    }

    await updateIndicator('EXTRACTING...', '#3b82f6');
    await scrapeCurrentPage();
}

/**
 * WhatsApp Specific Scraper
 */
async function scrapeWhatsApp() {
    console.log('🔍 [WHATSAPP] Starting extraction...');
    try {
        const headerEl = document.querySelector('header[data-testid="conversation-header"]');
        if (!headerEl) {
            console.log('⏳ Waiting for conversation header...');
            return;
        }

        const partnerNameEl = headerEl.querySelector('[data-testid="conversation-info-header-chat-title"]');
        const partnerName = partnerNameEl?.innerText || 'Unknown';

        // NEW: Extract Profile Picture URL from Header
        const avatarEl = headerEl.querySelector('img[src*="https://pps.whatsapp.net"]');
        const profilePicUrl = avatarEl?.getAttribute('src') || null;

        const messages = [];
        const msgItems = document.querySelectorAll('[data-testid="msg-container"]');

        msgItems.forEach(msg => {
            try {
                // Find visible text
                const selectableTextEl = msg.querySelector('.copyable-text');
                if (!selectableTextEl) return;

                const textSpan = selectableTextEl.querySelector('span[class*="selectable-text"]');
                const text = textSpan?.innerText?.trim();

                // If it has media but no text, we might still want it
                if (!text && !msg.querySelector('[data-testid="image-thumb"], [data-testid="video-thumb"], [data-testid="audio-player"]')) return;

                const isOutgoing = msg.closest('.message-out') !== null;
                const statusEl = msg.querySelector('[data-testid="msg-meta"]');
                const time = statusEl?.innerText || '';

                // Get internal WhatsApp ID and Chat ID
                const dataId = msg.closest('[data-id]')?.getAttribute('data-id') || msg.getAttribute('data-id');
                const jidMatch = dataId?.match(/_(.+@.+)_/);
                const chatId = jidMatch ? jidMatch[1] : (msg.closest('[data-pre-plain-text]') ? null : null);

                const id = dataId || Math.random().toString(36).substring(7);

                messages.push({
                    id,
                    chatId,
                    content: text,
                    isOutgoing,
                    timestamp: time,
                    partnerName, // Context
                    profilePicUrl // Add to each sync for routing
                });
            } catch (err) { }
        });

        if (messages.length > 0) {
            console.log(`✅ Extracted ${messages.length} messages from ${partnerName} (Pic: ${!!profilePicUrl})`);
            chrome.runtime.sendMessage({
                action: "whatsapp_data_extracted",
                partnerName,
                profilePicUrl, // Send at top level too
                messages,
                source: "whatsapp"
            });
            await updateIndicator(`SYNCED ${messages.length}`, '#10b981');
        } else {
            console.warn('⚠️ No messages found in current view.');
            await updateIndicator('NO MESSAGES', '#f59e0b');
        }
    } catch (e) {
        console.error('WhatsApp Scrape Error:', e);
        await updateIndicator('SYNC ERROR', '#ef4444');
    }
}

/**
 * Intelligent element waiter with Retries
 */
async function waitForElement(selector, timeout = 10000, retries = 3) {
    for (let r = 0; r < retries; r++) {
        const found = await new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(true);
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(true);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                resolve(false);
            }, timeout);
        });

        if (found) return true;

        // If not found, log retry and wait a bit
        console.warn(`⚠️ Element ${selector} not found (Attempt ${r + 1}/${retries}). Retrying...`);
        updateIndicator(`WAITING... (${r + 1})`, '#f59e0b');
        await new Promise(res => setTimeout(res, 2000));
    }
    return false;
}

/**
 * Detect and click cookie consent buttons
 */
async function dismissCookieBanners() {
    console.log('🍪 Checking for cookie banners...');
    const selectors = [
        '#onetrust-accept-btn-handler', // OneTrust
        '.cookie-policy-accept',         // Generic
        '.cookies-policy-close',
        '#cookie-accept-button',
        '.accept-cookies',
        '[class*="accept-cookie"]',
        '[class*="cookie-accept"]',
        '[class*="cookie-button"]',
        'button:contains("Kabul Et")',
        'button:contains("Anladım")'
    ];

    for (const s of selectors) {
        try {
            let btn;
            if (s.includes(':contains')) {
                const text = s.match(/"(.+)"/)[1];
                btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes(text));
            } else {
                btn = document.querySelector(s);
            }

            if (btn && btn.offsetParent !== null) {
                console.log('✅ Dismissing cookie banner:', s);
                btn.click();
                await new Promise(r => setTimeout(r, 1000)); // Wait for animation
            }
        } catch (e) { }
    }

    // Portal specific overlay dismissal
    if (source === 'hepsiemlak') {
        await dismissHepsiModals();
    }
}

/**
 * Specifically handle Hepsiemlak's persistent 'Daha Fazla Filtre' modal
 */
async function dismissHepsiModals() {
    console.log('🏘️ Checking for Hepsiemlak modals...');
    const selectors = [
        '.he-modal__close',        // Modal close 'X'
        '.he-modal button.ara',    // "Ara" button inside modal (if it acts as a submission)
        '.more-filters-modal .close'
    ];

    for (const s of selectors) {
        const btn = document.querySelector(s);
        if (btn && btn.offsetParent !== null) {
            console.log('✅ Dismissing Hepsiemlak modal:', s);
            btn.click();
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

/**
 * Mimic human behavior to avoid bot detection
 */
async function simulateHumanBehavior() {
    console.log('👤 Simulating human interaction (Full Scroll)...');

    // Scroll ALL the way to the bottom to trigger generic lazy loads
    let lastHeight = document.body.scrollHeight;
    let stuckCount = 0;
    let loops = 0;
    const MAX_LOOPS = 40; // Safety break to prevent infinite loops

    while (loops < MAX_LOOPS) {
        window.scrollBy({ top: 800, behavior: 'smooth' }); // Increased step
        await new Promise(r => setTimeout(r, 600)); // Faster wait

        let newHeight = document.body.scrollHeight;
        let currentPos = window.scrollY + window.innerHeight;

        // If we are at the bottom (with buffer)
        if (currentPos >= newHeight - 150) {
            console.log('⬇️ Reached bottom of page.');
            break;
        }

        // If height didn't change but we aren't at bottom
        if (newHeight === lastHeight) {
            stuckCount++;
            if (stuckCount > 4) {
                console.warn('⚠️ Scroll stuck, forcing break.');
                break;
            }
        } else {
            stuckCount = 0;
            lastHeight = newHeight;
        }
        loops++;
    }

    // Scroll back up slightly to ensure footer buttons are clickable (sometimes fixed headers cover them)
    window.scrollBy({ top: -150, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 500));
}

async function scrapeCurrentPage() {
    console.log('🔍 [DEBUG] Starting extraction...');
    const listings = [];
    const host = window.location.hostname;
    const source = host.includes('sahibinden') ? 'sahibinden' :
        (host.includes('hepsiemlak') || host.includes('hemlak.com')) ? 'hepsiemlak' :
            host.includes('emlakjet') ? 'emlakjet' : 'unknown';

    try {
        // DETECT BLOCKING PAGE
        const pageTitle = document.title;
        if (pageTitle.includes('Olağan') || pageTitle.includes('Access Denied') || pageTitle.includes('security')) {
            console.error('🛑 BLOCKED BY PORTAL');
            chrome.runtime.sendMessage({ action: "automation_finished", source: source || 'unknown', reason: "BLOCKED: " + pageTitle });
            return;
        }

        if (source === 'sahibinden') {
            // Broader selectors for different view types (List, Gallery, Map-List)
            const items = document.querySelectorAll('.searchResultsItem:not(.nativeAd), [data-id], tr.searchResultsItem, .classified-list-item, div.classified-list-item');

            console.log(`🔍 [SAHIBINDEN] Found ${items.length} potential items`);

            items.forEach(item => {
                const id = item.getAttribute('data-id');
                if (!id || isNaN(id) || id.length < 5) return;

                const titleEl = item.querySelector('.searchResultsTitleValue') || item.querySelector('.title') || item.querySelector('a[href*="/ilan/"]');
                const priceEl = item.querySelector('.searchResultsPriceValue') || item.querySelector('.price');
                const linkEl = item.querySelector('a[href*="/ilan/"]') || item.querySelector('a');

                // Get location string from row
                const locationEl = item.querySelector('.searchResultsLocationValue');
                const locationStr = locationEl ? locationEl.innerText.replace(/\n/g, ' ').trim() : '';

                // STRICT GEOGRAPHY FILTER (Enhanced & Relaxed)
                const lStr = locationStr.toLocaleLowerCase('tr-TR');
                const pageUrl = window.location.href.toLowerCase();
                const isPageAyvalik = pageUrl.includes('ayvalik') || pageUrl.includes('ayvalık');

                // If page is explicitly Ayvalık, we are safer. 
                // Checks: 1. Location text has Ayvalık OR 2. Page URL is Ayvalık AND location text isn't explicitly another city
                if (!lStr.includes('ayvalık') && !lStr.includes('ayvalik')) {
                    // Fallback: If we are on an Ayvalık-specific page, allow it.
                    if (isPageAyvalik) {
                        // Accept - we trust the URL filter
                    } else {
                        return; // Skip non-Ayvalık
                    }
                }

                const title = titleEl?.innerText.trim() || 'No Title';
                const price = parsePrice(priceEl?.innerText.trim());
                let url = linkEl?.getAttribute('href');
                if (url && !url.startsWith('http')) url = 'https://www.sahibinden.com' + (url.startsWith('/') ? '' : '/') + url;

                // Seller Type Detection
                const isOwnerPage = pageUrl.includes('a5_min=1') || pageUrl.includes('from_owner=true');
                const storeEl = item.querySelector('.searchResultsStoreNameValue');
                const hasStore = storeEl && storeEl.innerText.trim().length > 0;

                if (price > 0) {
                    const locParts = locationStr.split('/').map(s => s.trim());
                    listings.push({
                        external_id: 'sh-' + id,
                        title: title.substring(0, 100),
                        price, url, district: 'Ayvalık',
                        neighborhood: locParts[1] || locParts[0] || '',
                        seller_type: (isOwnerPage || !hasStore) ? 'owner' : 'office',
                        listing_date: new Date().toISOString().split('T')[0]
                    });
                }
            });
        }
        else if (source === 'hepsiemlak') {
            const items = document.querySelectorAll('.listing-item, .card-link, [class*="listing-card"], .list-view-item, a.card-link-clicker');
            items.forEach(item => {
                try {
                    const titleEl = item.querySelector('.title') || item.querySelector('h3') || item.querySelector('.card-link-clicker') || item.querySelector('[class*="title"]');
                    const priceEl = item.querySelector('.price') || item.querySelector('.list-view-price') || item.querySelector('.list-price') || item.querySelector('[class*="price"]') || item.querySelector('span[class*="listing-card--price"]');
                    const clicker = item.querySelector('.card-link-clicker') || (item.tagName === 'A' ? item : item.querySelector('a'));

                    const locationEl = item.querySelector('.list-view-location') || item.querySelector('[class*="location"]');
                    const locationStr = locationEl ? locationEl.innerText.trim() : '';
                    const lStr = locationStr.toLocaleLowerCase('tr-TR');

                    // STRICT GEOGRAPHY FILTER
                    if (!lStr.includes('ayvalık') && !lStr.includes('ayvalik')) {
                        return;
                    }

                    if (clicker && priceEl) {
                        let href = clicker.getAttribute('href') || '';
                        const url = href.startsWith('http') ? href : 'https://www.hepsiemlak.com' + (href.startsWith('/') ? '' : '/') + href;
                        let id = item.getAttribute('data-id') || item.id || '';

                        if (!id || id.length < 5) {
                            const match = url.match(/-(\d+)$/);
                            if (match) id = match[1];
                        }

                        if (id && id.length >= 5) {
                            const locParts = locationStr.split('/').map(s => s.trim());

                            // Seller Type Detection
                            const isOwnerUrl = window.location.href.includes('sahibinden=true') || window.location.href.includes('owner_type=owner');
                            const agencyEl = item.querySelector('.agency-name') || item.querySelector('.listing-card--owner-name');
                            const hasAgency = agencyEl && !agencyEl.innerText.toLowerCase().includes('sahibinden');

                            listings.push({
                                external_id: 'he-' + id,
                                title: (titleEl?.innerText || titleEl?.getAttribute('title') || 'No Title').trim().substring(0, 100),
                                price: parsePrice(priceEl.innerText),
                                url,
                                district: 'Ayvalık',
                                neighborhood: locParts[2] || locParts[1] || '',
                                seller_type: (isOwnerUrl || !hasAgency) ? 'owner' : 'office',
                                listing_date: new Date().toISOString().split('T')[0]
                            });
                        }
                    }
                } catch (err) { console.error('Extration error (item):', err); }
            });
        }
        else if (source === 'emlakjet') {
            const items = document.querySelectorAll('a[class*="styles_wrapper__"], [class*="listingItem"], a[class*="listing-item"]');
            items.forEach(item => {
                try {
                    const titleEl = item.querySelector('h3') || item.querySelector('.title') || item.querySelector('[class*="styles_title__"]') || item.querySelector('[class*="listing-item--title"]');
                    const priceEl = Array.from(item.querySelectorAll('span, p, div')).find(el => el.innerText.includes('TL')) || item.querySelector('[class*="styles_price__"]');

                    const spans = Array.from(item.querySelectorAll('span'));
                    const locationEl = spans.find(s => s.innerText.toLocaleLowerCase('tr-TR').includes('ayvalık') || s.innerText.toLowerCase().includes('ayvalik') || s.innerText.toLocaleLowerCase('tr-TR').includes('balıkesir'));
                    const locationStr = locationEl ? locationEl.innerText.trim() : '';
                    const lStr = locationStr.toLocaleLowerCase('tr-TR');

                    // STRICT GEOGRAPHY FILTER
                    if (!lStr.includes('ayvalık') && !lStr.includes('ayvalik')) {
                        return;
                    }

                    if (titleEl && priceEl) {
                        const url = item.href || item.querySelector('a')?.href;
                        if (!url) return;

                        const idMatch = url.match(/-(\d+)\/?$/) || url.match(/-(\d+)(?:\.html)?$/);
                        const id = idMatch ? idMatch[1] : (url.split('-').pop().replace(/[^\d]/g, ''));

                        if (!id || id.length < 5) return;

                        // Seller Type Detection (Emlakjet specific)
                        const officeNameEl = item.querySelector('div[class*="styles_officeName__"]') || item.querySelector('[class*="office-name"]');
                        const isOwner = item.innerText.includes('Sahibinden') || !officeNameEl;

                        const locParts = locationStr.split('-').map(s => s.trim());
                        listings.push({
                            external_id: 'ej-' + id,
                            title: titleEl.innerText.trim().substring(0, 100),
                            price: parsePrice(priceEl.innerText),
                            url,
                            district: 'Ayvalık',
                            neighborhood: locParts[1] || locParts[0] || '',
                            seller_type: isOwner ? 'owner' : 'office',
                            listing_date: new Date().toISOString().split('T')[0]
                        });
                    }
                } catch (err) { }
            });
        }
    } catch (e) {
        console.error('Scrape Error:', e);
        await updateIndicator('ERROR', '#ef4444');
    }

    console.log(`✅ Extracted: ${listings.length} items from ${source}`);
    if (listings.length === 0) {
        console.warn('🔍 [DEBUG] Current Page Content Snippet:', document.body.innerText.substring(0, 500));
        // Also log some element counts to help identify why it failed
        console.log(`   - Potential items count (divs): ${document.querySelectorAll('div').length}`);
        console.log(`   - Potential links count (as): ${document.querySelectorAll('a').length}`);
        await updateIndicator('EMPTY PAGE', '#f59e0b');
    } else {
        await updateIndicator(`EXTRACTED ${listings.length}`, '#059669');
    }

    // ALWAYS send message, even if empty, so background knows we're alive
    chrome.runtime.sendMessage({ action: "data_extracted", listings, source });
    isCurrentlyScraping = false;
}

async function goToNextPage() {
    const host = window.location.hostname;
    const source = host.includes('sahibinden') ? 'sahibinden' :
        (host.includes('hepsiemlak') || host.includes('hemlak.com')) ? 'hepsiemlak' :
            host.includes('emlakjet') ? 'emlakjet' : 'unknown';

    // Retry finding the next button for up to 10 seconds
    for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`🔎 Looking for next page button (Attempt ${attempt}/5)...`);

        const selectors = [
            '.prevNextBut[title="Sonraki"]',
            'a.prevNextBut[title="Sonraki"]',
            '.pageNavContainer a.next',
            'a.he-pagination__next', // Hepsiemlak
            'a[class*="nextPage"]',   // Emlakjet
            'button[class*="nextPage"]',
            'a[aria-label*="Sonraki"]',
            'a[aria-label*="Next"]',
            'li.next a',
            '.pagination__next a',
            'a[title="Sonraki"]',
            'a:contains("Sonraki")' // Pseudo-selector logic handled below
        ];

        let btn = null;
        // 1. Selector-based search
        for (const s of selectors) {
            if (s.includes(':contains')) continue;
            const el = document.querySelector(s);
            if (el && !el.classList.contains('disabled') && !el.hasAttribute('disabled') && el.style.display !== 'none') {
                btn = el;
                break;
            }
        }

        // 2. Text-based search (Fuzzy)
        if (!btn) {
            const terms = ["Sonraki", "Sıradaki", "Next", "Next Page", "Sonraki Sayfa", ">", "»", "Daha Fazla", "Load More", "İlanları Gör"];
            const links = Array.from(document.querySelectorAll('a, button, span, div[role="button"], li'));
            btn = links.find(el => {
                const text = (el.innerText || '').trim();
                const title = (el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
                // Check visibility
                const visible = el.offsetParent !== null || (window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden');

                const isFilterButton = text.includes('Filtre') || title.includes('Filtre') || text.includes('Filter') || title.includes('Filter');

                // Use INCLUDES instead of strict equality for better matching
                return terms.some(t => text.includes(t) || title.includes(t)) && visible && !isFilterButton;
            });
        }

        if (btn) {
            console.log('➡️ Moving to next page via:', btn);
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(r => setTimeout(r, 500)); // Wait for scroll
            btn.click();

            // Anti-Stall: If page doesn't change in 15s, report failure
            // IMPROVED: Check if URL changed (SPA) before killing it
            const currentUrl = location.href;
            setTimeout(() => {
                // If URL is same AND we aren't scraping -> Stuck
                // If URL changed, the SPA monitor should have handled it
                if (!isCurrentlyScraping && location.href === currentUrl) {
                    chrome.runtime.sendMessage({ action: "automation_finished", source, reason: "Page change timeout (Stuck on same URL)" });
                }
            }, 15000);

            return true;
        }

        // Wait before retry
        await new Promise(r => setTimeout(r, 2000));
    }

    // FALLBACK: Force URL Navigation if button is missing (Hepsi/Emlakjet specific)
    console.warn('⚠️ Button click failed or not found. Attempting Force URL Navigation...');

    // Hepsiemlak: ?page=1 -> ?page=2
    if (source === 'hepsiemlak') {
        const urlParams = new URLSearchParams(window.location.search);
        let page = parseInt(urlParams.get('page')) || 1;
        urlParams.set('page', page + 1);
        const newUrl = window.location.pathname + '?' + urlParams.toString();
        console.log(`🚀 Force navigating to: ${newUrl}`);
        window.location.href = newUrl;
        return true;
    }

    // Emlakjet: /satilik-konut/.../2 -> /satilik-konut/.../3
    else if (source === 'emlakjet') {
        let currentUrl = window.location.href;
        // Check if ends in number
        const match = currentUrl.match(/\/(\d+)\/?$/);
        if (match) {
            const page = parseInt(match[1]) + 1;
            const newUrl = currentUrl.replace(/\/(\d+)\/?$/, `/${page}`);
            console.log(`🚀 Force navigating to: ${newUrl}`);
            window.location.href = newUrl;
            return true;
        } else {
            // First page, append /2
            // Remove query params first if any, then append
            const cleanUrl = currentUrl.split('?')[0].replace(/\/$/, '');
            const query = currentUrl.split('?')[1] || '';
            const newUrl = `${cleanUrl}/2` + (query ? `?${query}` : '');
            console.log(`🚀 Force navigating to: ${newUrl}`);
            window.location.href = newUrl;
            return true;
        }
    }

    console.log('🏁 No more pages detected after retries.');
    chrome.runtime.sendMessage({ action: "automation_finished", source, reason: "No next button found after 5 attempts" });
    return false;
}

function parsePrice(text) {
    if (!text) return 0;
    return parseFloat(text.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '')) || 0;
}
