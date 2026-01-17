const puppeteer = require('puppeteer-extra');
const { createStealthBrowser, configureStealthPage, humanizePage } = require('./browserFactory');
const cron = require('node-cron');
const prisma = require('../db');

// ... (keep normalizeNeighborhood)

const normalizeNeighborhood = (name) => {
    if (!name) return '';
    let clean = name.trim();
    // Remove "Mahallesi", "Mah", "Mah.", "Mh.", "Mh" case insensitive
    clean = clean.replace(/\s+Mahallesi/i, '')
        .replace(/\s+Mah\.?/i, '')
        .replace(/\s+Mh\.?/i, '')
        .trim();

    // Always add " Mah." suffix
    return clean + ' Mah.';
};
const { sendNewListingNotification } = require('./notificationService');
const { findMatches } = require('./matchService');
const { checkOpportunity } = require('./analyticsService');

// URLs Configuration
// ... (keep NEIGHBORHOODS)

const NEIGHBORHOODS = [
    {
        name: 'Ali Çetinkaya',
        hepsiemlak: 'https://www.hepsiemlak.com/ayvalik-ali-cetinkaya-satilik/daire',
        sahibinden: 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-alicetinkaya-mh'
    },
    {
        name: '150 Evler',
        hepsiemlak: 'https://www.hepsiemlak.com/150-evler-satilik',
        sahibinden: 'https://www.sahibinden.com/satilik-daire/balikesir-ayvalik-150-evler-mh'
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

        // Apply stealth configuration
        await configureStealthPage(page);
        await humanizePage(page);

        // ... rest of the logic

        if (provider === 'all' || provider === 'hepsiemlak') {
            for (const hood of NEIGHBORHOODS) {
                console.log(`Targeting Hepsiemlak: ${hood.name}`);

                // 1. Standard Scrape
                await scrapeHepsiemlak(page, hood.hepsiemlak);

                // 2. Owner Specific Scrape using the discovered URL pattern
                if (hood.hepsiemlak.includes('satilik')) {
                    const ownerUrl = hood.hepsiemlak.replace('satilik', 'satilik-sahibinden');
                    console.log(`Targeting Hepsiemlak (Owner Tab): ${ownerUrl}`);
                    await scrapeHepsiemlak(page, ownerUrl, 'owner');
                }
            }
        }

        if (provider === 'all' || provider === 'sahibinden') {
            for (const hood of NEIGHBORHOODS) {
                console.log(`Targeting Sahibinden: ${hood.name}`);
                const { scrapeSahibindenStealth } = require('./stealthScraper');
                const listings = await scrapeSahibindenStealth(hood.sahibinden);
                await saveListings(listings);
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

async function scrapeHepsiemlak(page, url, forcedSellerType = null) {
    console.log(`--- Scraping Hepsiemlak (${url}) [Forced Type: ${forcedSellerType || 'Auto'}] ---`);
    let allListings = [];
    let pageNum = 1;
    let hasNextPage = true;

    while (hasNextPage && pageNum <= 50) {
        const pageUrl = `${url}?page=${pageNum}`;
        console.log(`Navigating to Hepsiemlak Page ${pageNum}: ${pageUrl}`);

        try {
            await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

            const listings = await page.evaluate((forcedSellerType) => {
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
                    if (roomMatch) rooms = roomMatch[1].replace(/\s/g, ''); // Normalize to "2+1"

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

                    // Seller Type Detection (Hepsiemlak)
                    let seller_type = forcedSellerType || 'office';

                    if (!forcedSellerType) {
                        const ownerInfoEl = item.querySelector('.listing-card--owner-info');
                        if (ownerInfoEl) {
                            const infoText = ownerInfoEl.innerText.toLowerCase();
                            if (infoText.includes('sahibinden')) {
                                seller_type = 'owner';
                            } else if (infoText.includes('banka')) {
                                seller_type = 'bank';
                            } else if (infoText.includes('inşaat') || infoText.includes('proje')) {
                                seller_type = 'construction';
                            }
                        } else {
                            if (item.innerText.toLowerCase().includes('sahibinden satılık')) {
                                seller_type = 'owner';
                            }
                        }
                    }

                    data.push({ external_id: id, title, price, url, district, neighborhood, rooms, size_m2, listing_date, seller_type });
                });
                return data;
            }, forcedSellerType);

            if (listings.length === 0) {
                hasNextPage = false;
            } else {
                const newIds = listings.map(l => l.external_id);
                const existingIds = new Set(allListings.map(l => l.external_id));
                const isDuplicatePage = newIds.every(id => existingIds.has(id));

                if (isDuplicatePage && allListings.length > 0) {
                    console.log('Duplicate page detected. Stopping Hepsiemlak scrape.');
                    hasNextPage = false;
                } else {
                    console.log(`Found ${listings.length} listings.`);
                    allListings = [...allListings, ...listings];
                    pageNum++;
                }
            }

        } catch (e) {
            console.log(`Error on page ${pageNum}: ${e.message}`);
            hasNextPage = false;
        }
    }

    await saveListings(allListings);
}

async function saveListings(listings) {
    if (listings.length === 0) return;
    console.log(`Saving ${listings.length} listings to DB...`);

    for (const item of listings) {
        const { external_id, title, price, url, district, neighborhood, rooms, size_m2, listing_date } = item;

        // Check if property exists
        const existingProp = await prisma.property.findUnique({
            where: { external_id: external_id }
        });

        if (!existingProp) {
            try {
                const newProp = await prisma.property.create({
                    data: {
                        external_id,
                        title,
                        price: price.toString(),
                        url,
                        district,
                        neighborhood,
                        rooms,
                        size_m2,
                        seller_type: item.seller_type || 'office',
                        listing_date: listing_date ? new Date(listing_date) : null,
                        last_scraped: new Date()
                    }
                });

                await prisma.propertyHistory.create({
                    data: {
                        property_id: newProp.id,
                        price: price.toString(),
                        change_type: 'initial'
                    }
                });
            } catch (err) {
                console.error(`ERROR creating property ${external_id}:`, err.message);
                continue;
            }

            const matches = await findMatches(item);
            if (matches.length > 0) {
                // console.log(`🎯 CRM Match found! ${matches.length} clients are interested.`);
            }

        } else {
            await prisma.property.update({
                where: { id: existingProp.id },
                data: {
                    title,
                    url,
                    district,
                    neighborhood,
                    rooms,
                    size_m2,
                    seller_type: item.seller_type || existingProp.seller_type, // Prefer checking actual type over keeping old? Hmm.
                    listing_date: listing_date ? new Date(listing_date) : null,
                    last_scraped: new Date()
                }
            });

            if (parseFloat(existingProp.price) !== price) {
                await prisma.propertyHistory.create({
                    data: {
                        property_id: existingProp.id,
                        price: price.toString(),
                        change_type: price > parseFloat(existingProp.price) ? 'price_increase' : 'price_decrease'
                    }
                });

                await prisma.property.update({
                    where: { id: existingProp.id },
                    data: { price: price.toString() }
                });
            }
        }
    }
    console.log('Finished saving listings.');
}

const startScheduler = () => {
    cron.schedule('0 */4 * * *', () => {
        scrapeProperties('all');
    });
    console.log('Scraper scheduler started.');
};

const { scrapeSahibindenDetails } = require('./stealthScraper');

async function scrapeDetails(url) {
    if (url.includes('sahibinden.com')) {
        return await scrapeSahibindenDetails(url);
    }

    // Hepsiemlak Logic
    console.log(`--- Scraping Hepsiemlak Details (${url}) ---`);
    let browser;
    try {
        const { getOrLaunchBrowser } = require('./stealthScraper');
        browser = await getOrLaunchBrowser();
        const page = await browser.newPage();
        // await configureStealthPage(page); // Not needed as master chrome is already stealthy? Or maybe good to keep if I had access to it, but getOrLaunchBrowser doesn't export it. 
        // Actually, main page already does setViewport etc.
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const data = await page.evaluate(() => {
            // Description
            const description = document.querySelector('.description-content')?.innerText.trim() || '';

            // Images
            // Try different selectors
            let images = [];
            const gallery = document.querySelectorAll('.detail-gallery img');
            if (gallery.length > 0) {
                gallery.forEach(img => images.push(img.src));
            } else {
                const allImgs = document.querySelectorAll('.img-wrapper img');
                allImgs.forEach(img => images.push(img.src));
            }
            // Filter out small icons or base64 if needed, but for now grab all unique
            images = [...new Set(images)]
                .filter(src => src.startsWith('http'))
                .map(src => {
                    // Hepsiemlak: Remove /mnresize/width/height/ to get full resolution
                    if (src.includes('hemlak.com') && src.includes('/mnresize/')) {
                        return src.replace(/\/mnresize\/\d+\/\d+\//, '/');
                    }
                    return src;
                });

            // Features (Spec List)
            const features = [];
            const specs = document.querySelectorAll('.spec-item');
            specs.forEach(s => features.push(s.innerText.trim().replace(/\n/g, ': ')));

            // Seller Info
            let seller_name = null;
            let seller_phone = null;
            const firmBox = document.querySelector('.firm-box-inc');
            if (firmBox) {
                const nameEl = firmBox.querySelector('.firm-box--name');
                if (nameEl) seller_name = nameEl.innerText.trim();

                // Try to find phone
                const phoneLink = document.querySelector('.phone-wrapper a');
                if (phoneLink) seller_phone = phoneLink.href.replace('tel:', '');
            } else {
                // Owner check
                const ownerName = document.querySelector('.owner-info span');
                if (ownerName) seller_name = ownerName.innerText.trim();
            }

            return { description, images, features, seller_name, seller_phone };
        });

        return data;

    } catch (e) {
        console.error('Hepsiemlak Detail Scrape Error:', e);
        throw e;
    } finally {
        if (browser) await browser.disconnect();
    }
}

module.exports = { scrapeProperties, startScheduler, scrapeDetails };
