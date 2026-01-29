require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const puppeteer = require('puppeteer-extra');
const { scrapeSahibindenDetails } = require('../services/stealthScraper');
const { findOrCreateConsultant } = require('../services/scraperService');
const { humanizePage } = require('../services/browserFactory');

async function rescrapeAndAssign() {
    console.log('🚀 Starting Rescrape & Assign Job (Connecting to Brave/Chrome on 9222)...');

    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log('✅ Connected to Browser on Port 9222');
    } catch (e) {
        console.error('❌ Could not connect to Browser. Is it open with --remote-debugging-port=9222?');
        console.error(e.message);
        return;
    }

    // Reuse the existing active page if possible, or create new tab
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('sahibinden.com'));
    if (!page) {
        console.log('📄 No Sahibinden tab found, creating new one...');
        page = await browser.newPage();
    } else {
        console.log('♻️ Reusing existing Sahibinden tab');
        await page.bringToFront();
    }
    await humanizePage(page);

    try {
        const properties = await prisma.property.findMany({
            where: {
                seller_name: { contains: 'Trio', mode: 'insensitive' },
                url: { contains: 'sahibinden.com' },
                status: 'active'
            }
        });

        console.log(`📋 Found ${properties.length} agency properties to process.`);

        for (const prop of properties) {
            console.log(`Processing: ${prop.url} (Current Seller: ${prop.seller_name})`);

            try {
                // Pass the specific page to force reuse
                if (!page) {
                    throw new Error("❌ Page object is missing! Cannot proceed in shared mode.");
                }
                const details = await scrapeSahibindenDetails(prop.url, page);

                if (details.seller_name && details.seller_name !== prop.seller_name && details.seller_name !== 'Dosya Sahibi' && details.seller_name !== 'Bilinmiyor') {
                    console.log(`   ✨ Updated Seller Name: ${details.seller_name}`);

                    let assignedId = null;
                    try {
                        if (!details.seller_name.toLowerCase().includes('trio emlak')) {
                            assignedId = await findOrCreateConsultant(details.seller_name, details.seller_phone || '');
                        }
                    } catch (e) {
                        console.log(`   ⚠️ Could not match consultant: ${e.message}`);
                    }

                    await prisma.property.update({
                        where: { id: prop.id },
                        data: {
                            seller_name: details.seller_name,
                            seller_phone: details.seller_phone,
                            assigned_user_id: assignedId || prop.assigned_user_id || undefined,
                            description: details.description || prop.description,
                            features: details.features || prop.features
                        }
                    });
                    console.log(`   ✅ Saved changes. Assigned to: ${assignedId}`);
                } else {
                    console.log(`   ⏭️ Name '${details.seller_name}' is not better than current.`);
                }

                console.log('   ⏳ Waiting 5 seconds...');
                await new Promise(r => setTimeout(r, 5000));

            } catch (err) {
                console.error(`   ❌ Failed to process ${prop.id}:`, err.message);

                // Panic Recovery: If session closed, try to re-acquire page
                if (err.message.includes('Session closed') || err.message.includes('Protocol error')) {
                    console.log('🔄 Session death detected. Attempting to re-acquire page...');
                    try {
                        const pages = await browser.pages();
                        page = pages.find(p => p.url().includes('sahibinden.com'));
                        if (!page) {
                            // If no page found, maybe user closed it? Open new one and try to save run
                            const newPage = await browser.newPage();
                            // We wait for user to maybe interact or just use this blank one if scraping allows
                            page = newPage;
                        }
                    } catch (recErr) {
                        console.error('💥 Could not recover session. Stopping.', recErr.message);
                        break;
                    }
                }
            }
        }

    } catch (e) {
        console.error('Job Failed:', e);
    } finally {
        await browser.disconnect();
        await prisma.$disconnect();
    }
}

rescrapeAndAssign();
