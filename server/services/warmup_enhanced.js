const { createStealthBrowser, saveBrowserState, humanizePage } = require('./browserFactory');
const scraperConfig = require('../config/scraperConfig');
const { getSessionManager } = require('./sessionManager');

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
            const sessionMgr = getSessionManager();
            sessionMgr.addEvent('Sahibinden: Blok tespiti! El ile geçilmesi bekleniyor...', 'warning', 'sahibinden');
            process.stdout.write('\x07'); // Bell sound

            // Enhanced feedback during wait
            let waitStartTime = Date.now();
            const feedbackInterval = scraperConfig.timeouts.blockWaitFeedbackInterval || 10000;

            // Set up periodic feedback
            const feedbackTimer = setInterval(() => {
                const elapsedSeconds = Math.floor((Date.now() - waitStartTime) / 1000);
                console.log(`⏳ Still waiting for block clearance... (${elapsedSeconds}s elapsed)`);
                sessionMgr.addEvent(`Hala bekleniyor... (${elapsedSeconds}s)`, 'info', 'sahibinden');
            }, feedbackInterval);

            // Wait until block clears
            try {
                await page.waitForFunction((indicators) => {
                    const t = document.title;
                    const b = document.body.innerText;
                    return !indicators.some(i => t.includes(i) || b.includes(i));
                }, { timeout: 0, polling: 2000 }, scraperConfig.selectors.blockIndicators);
            } finally {
                clearInterval(feedbackTimer);
            }

            console.log('✅ Block cleared! Resuming...');
            sessionMgr.addEvent('Sahibinden: Engel aşıldı, devam ediliyor.', 'success', 'sahibinden');
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
 * Performs organic warmup behaviors - ENHANCED VERSION
 */
async function organicWarmup(page) {
    if (page.url().includes('sahibinden.com')) {
        console.log('♻️ Already on target domain, skipping warmup.');
        return;
    }

    console.log('🌍 Performing Enhanced Organic Warmup...');
    try {
        await page.goto('https://www.google.com.tr', { waitUntil: 'domcontentloaded' });
        await humanizePage(page);
        await page.randomWait(scraperConfig.timeouts.warmupDelayMin || 5000, scraperConfig.timeouts.warmupDelayMax || 10000);

        const searchBox = await page.$('textarea[name="q"]') || await page.$('input[name="q"]');
        if (searchBox) {
            const queries = ['sahibinden satılık', 'ayvalık emlak', 'sahibinden kiralık'];
            const query = queries[Math.floor(Math.random() * queries.length)];

            // Type with realistic human delays
            console.log(`🔎 Searching for: "${query}"`);
            await searchBox.type(query, { delay: 100 + Math.random() * 100 });
            await page.randomWait(500, 1500); // Think time before searching
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => { });

            // Random scroll on search results - more realistic
            await page.randomWait(2000, 4000);
            await page.randomScroll();
            await page.randomWait(1000, 3000);
            await page.randomScroll();

            // Try to click a sahibinden result if found
            const link = await page.$('a[href*="sahibinden.com"]');
            if (link) {
                console.log('🔗 Clicking on sahibinden search result...');
                // Move mouse to link before clicking (more human-like)
                await page.mouseMoveOrganic('a[href*="sahibinden.com"]').catch(() => { });
                await page.randomWait(500, 1500);

                await Promise.all([
                    page.waitForNavigation({ timeout: 60000 }).catch(() => { }),
                    link.click()
                ]);

                // Spend some time on the page we landed on
                await page.randomWait(3000, 6000);
                await page.randomScroll();
                console.log('✅ Warmup complete - now on sahibinden domain');
            }
        }
    } catch (e) {
        console.log('⚠️ Warmup partial fail, proceeding:', e.message);
    }
}
