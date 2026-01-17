const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function verifyConnection() {
    console.log('🔍 Connecting to Master Chrome...');
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const pages = await browser.pages();
        const sahibindenPage = pages.find(p => p.url().includes('sahibinden.com'));

        if (!sahibindenPage) {
            console.log('❌ Sahibinden tab not found. Please open sahibinden.com in the black console window.');
        } else {
            const title = await sahibindenPage.title();
            console.log(`📄 Current Page Title: "${title}"`);

            if (title.includes('Hata') || title.includes('Access denied') || title.includes('Olağan dışı')) {
                console.log('🛑 STILL BLOCKED. Page has error title.');
            } else {
                console.log('✅ Connection looks GOOD! Ready to scrape.');
            }
        }

        await browser.disconnect();
    } catch (e) {
        console.error('❌ Connection Failed:', e.message);
    }
}

verifyConnection();
