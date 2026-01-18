const { scrapeSahibindenStealth, scrapeSahibindenDetails, getOrLaunchBrowser } = require('../services/stealthScraper');
const { scrapeDetails: scrapeHepsiemlakDetails } = require('../services/scraperService');
const prisma = require('../db');
const bcrypt = require('bcryptjs');

const AGENCIES = [
    { provider: 'hepsiemlak', url: 'https://www.hepsiemlak.com/emlak-ofisi/trio-emlak-gayrimenkul-danismanlik-138391' },
    { provider: 'sahibinden', url: 'https://trioemlakvegayrimenkul.sahibinden.com/' }
];

async function syncAgency() {
    console.log('🚀 Starting Agency Portfolio Sync...');

    for (const agency of AGENCIES) {
        console.log(`\n🏢 Processing Agency Profile: ${agency.url}`);

        let listings = [];

        try {
            if (agency.provider === 'sahibinden') {
                // Scrape Listing URLs first
                listings = await scrapeSahibindenStealth(agency.url);
            } else {
                // Hepsiemlak scrape logic
                const { getOrLaunchBrowser } = require('../services/stealthScraper');
                const browser = await getOrLaunchBrowser();
                const page = await browser.pages().then(p => p[0] || browser.newPage());
                await page.goto(agency.url, { waitUntil: 'domcontentloaded' });

                // Hepsiemlak Store Pagination (?)
                listings = await page.evaluate(() => {
                    const items = document.querySelectorAll('.listing-item');
                    const data = [];
                    items.forEach(item => {
                        const urlEl = item.querySelector('a.card-link');
                        const url = urlEl ? 'https://www.hepsiemlak.com' + urlEl.getAttribute('href') : '';
                        const id = item.id;
                        const title = item.querySelector('.list-view-title h3')?.innerText.trim() || 'No Title';
                        const priceEl = item.querySelector('.list-view-price');
                        const price = priceEl ? parseFloat(priceEl.innerText.replace(/\./g, '').replace(/[^\d]/g, '')) : 0;
                        if (url) data.push({ external_id: id, url, title, price });
                    });
                    return data;
                });
            }
        } catch (err) {
            console.error(`❌ Failed to fetch listing list from ${agency.url}:`, err.message);
            continue;
        }

        console.log(`📌 Found ${listings.length} listings to sync.`);

        // Create a persistent page for details if needed
        let detailPage = null;
        if (agency.provider === 'sahibinden') {
            const { getOrLaunchBrowser } = require('../services/stealthScraper');
            const { humanizePage } = require('../services/browserFactory');
            const browser = await getOrLaunchBrowser();
            // Reuse the existing tab we just scraped URLs with, or get a new one
            const pages = await browser.pages();
            detailPage = pages.find(p => p.url().includes('sahibinden.com')) || await browser.newPage();
            await humanizePage(detailPage);
            console.log('📌 Using persistent tab for detail scraping.');
        }

        // Process each listing
        for (const [index, list] of listings.entries()) {
            console.log(`\n[${index + 1}/${listings.length}] 🔄 Syncing: ${list.title} (${list.url})`);

            let details = {};
            let isBlocked = false;
            try {
                if (agency.provider === 'sahibinden') {
                    // Pass the persistent page!
                    details = await scrapeSahibindenDetails(list.url, detailPage);
                } else {
                    details = await scrapeHepsiemlakDetails(list.url);
                }
            } catch (err) {
                console.error(`⚠️ Failed to scrape details for ${list.url}:`, err.message);
                if (err.message.includes('BLOCK')) isBlocked = true;
                // Continue with partial data if possible
            }

            // If we got blocked on Sahibinden details, maybe just fallback to Office user
            const consultantName = details.seller_name || 'Trio Emlak Ofisi';
            const consultantPhone = details.seller_phone || '';

            console.log(`👤 Consultant Info: ${consultantName} (${consultantPhone})`);

            // 1. Find or Create User
            // Generate email from name: Tolga Ozan -> tolga.ozan@trio.com
            const email = toEmail(consultantName);

            let user = await prisma.user.findFirst({
                where: { OR: [{ email: email }] }
            });

            if (!user) {
                console.log(`✨ Creating NEW Consultant Account: ${email}`);
                const hashedPassword = await bcrypt.hash('123456', 10);
                user = await prisma.user.create({
                    data: {
                        email,
                        role: consultantName.includes('Ofisi') ? 'admin' : 'consultant',
                        password_hash: hashedPassword
                    }
                });
            } else {
                console.log(`✅ Existing Consultant: ${user.email} (ID: ${user.id})`);
            }

            // 2. Upsert Property
            await prisma.property.upsert({
                where: { external_id: list.external_id },
                update: {
                    assigned_user_id: user.id,
                    last_scraped: new Date(),
                    price: list.price.toString(),
                    seller_name: consultantName,
                    seller_phone: consultantPhone,
                    images: details.images || [],
                    features: details.features || [],
                    description: details.description || '',
                    ...(details.size_m2 > 0 && { size_m2: details.size_m2 }),
                    ...(details.rooms && { rooms: details.rooms }),
                },
                create: {
                    external_id: list.external_id,
                    title: list.title,
                    url: list.url,
                    price: list.price.toString(),
                    seller_type: 'office',
                    category: agency.provider === 'sahibinden' ? 'residential' : 'residential',
                    assigned_user_id: user.id,
                    last_scraped: new Date(),
                    seller_name: consultantName,
                    seller_phone: consultantPhone,
                    images: details.images || [],
                    features: details.features || [],
                    description: details.description || '',
                    size_m2: details.size_m2 || null,
                    rooms: details.rooms || null,
                }
            });

            console.log(`✅ Property Synced & Assigned to ${user.email}.`);

            // Wait RANDOM time to avoid rate limits (User Request)
            const minWait = agency.provider === 'sahibinden' ? 45000 : 3000;
            const maxWait = agency.provider === 'sahibinden' ? 85000 : 8000;
            const waitTime = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;

            if (agency.provider === 'sahibinden') console.log(`⏳ Waiting ${Math.round(waitTime / 1000)}s for safety...`);
            await new Promise(r => setTimeout(r, waitTime));
        }

        // We don't close the detailPage here as per user request to keep tabs open/reuse. 
        // Although if we move to next agency, we might want to? 
        // User said "don't close/open pages", so let's leave it.
    }

    console.log('🏁 Sync Complete!');
}

function toEmail(name) {
    const map = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'c', 'Ğ': 'g', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    };
    let clean = name.trim().toLowerCase();
    for (const key in map) {
        clean = clean.replace(new RegExp(key, 'g'), map[key]);
    }
    const parts = clean.split(/\s+/);
    return `${parts.join('.')}@trioemlak.com`; // Pseudo domain
}

syncAgency();
