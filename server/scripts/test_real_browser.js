const { launchRealBrowser } = require('../services/realBrowser');
const { organicNav } = require('../services/scraperService'); // We need to export this or copy it
// Since organicNav is internal to scraperService and not exported, I will copy the logic here for the test to ensure isolation.

async function testOrganicNav(page, targetUrl) {
    try {
        console.log('🌍 Organic Entry: Starting Search Engine routing (Bing)...');
        await page.goto('https://www.bing.com', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1500));

        // Handle Bing Cookie Banner (Generic)
        const acceptBtn = await page.$('#bnp_btn_accept') || await page.$('button[id*="accept"]');
        if (acceptBtn) {
            console.log('🍪 Bing Cookie Banner detected. Clicking accept...');
            await acceptBtn.click();
            await new Promise(r => setTimeout(r, 500));
        }

        // Random Queries
        const queries = [
            'hepsiemlak ayvalık satılık daire',
            'hepsiemlak balıkesir ayvalık ilanlar',
            'ayvalık satılık yazlık hepsiemlak'
        ];
        const query = queries[Math.floor(Math.random() * queries.length)];
        console.log(`🔍 Searching Bing for: "${query}"`);

        const searchBox = await page.$('[name="q"]');
        if (searchBox) {
            await searchBox.type(query, { delay: 100 });
            await page.keyboard.press('Enter');
            // Wait longer for results
            await new Promise(r => setTimeout(r, 6000));

            // Find result using broad selector
            const links = await page.$$('a[href*="hepsiemlak.com"]');
            if (links.length > 0) {
                console.log(`✅ Found ${links.length} Hepsiemlak links on Bing. Clicking first...`);
                await Promise.all([
                    page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => { }),
                    links[0].click()
                ]);
                return; // Success
            }
        }
        console.log('⚠️ Bing Search fallback: Link not found.');
    } catch (e) {
        console.log(`⚠️ Organic Nav failed (${e.message}).`);
    }

    // Fallback: Direct entry with FAKE REFERER
    console.log('👻 Applying Fake Referer Strategy (Google) and navigating directly...');
    try {
        await page.setExtraHTTPHeaders({
            'Referer': 'https://www.google.com/',
            'Sec-Fetch-Site': 'same-origin'
        });
    } catch (err) { }

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
}

async function runTest() {
    console.log('🧪 Starting Local RealBrowser Test...');

    // Set NODE_ENV to development to see headful if possible (or user can run as is)
    // process.env.NODE_ENV = 'development'; 

    let browser, page;
    try {
        const result = await launchRealBrowser();
        browser = result.browser;
        page = result.page;

        console.log('✅ Browser Launched.');

        await testOrganicNav(page, 'https://www.hepsiemlak.com/ayvalik-satilik/daire?page=1');

        console.log('⏳ Waiting for Cloudflare Evasion (15s)...');
        await new Promise(r => setTimeout(r, 15000));

        const title = await page.title();
        console.log(`📄 Page Title after wait: "${title}"`);

        if (title.includes('Just a moment')) {
            console.log('❌ Still stuck on Cloudflare.');
        } else {
            console.log('✅ Cloudflare Passed! We are on the site.');
            // Take a screenshot if possible? 
            // await page.screenshot({ path: 'local_test_result.png' });
        }

    } catch (e) {
        console.error('❌ Test failed:', e);
    } finally {
        if (browser) {
            // await browser.close();
            console.log('ℹ️ Browser left open for inspection. Press Ctrl+C to exit.');
        }
    }
}

runTest();
