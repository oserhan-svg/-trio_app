const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function diagnose() {
    console.log('🔍 DIAGNOSTIC: Connecting to Master Chrome...');
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const pages = await browser.pages();
        const sahibindenPage = pages.find(p => p.url().includes('sahibinden.com'));

        if (!sahibindenPage) {
            console.log('❌ No Sahibinden tab found!');
            console.log('Open tabs:', pages.map(p => p.url()));
            await browser.disconnect();
            return;
        }

        console.log('✅ Found Sahibinden Tab!');
        console.log('🔗 URL:', sahibindenPage.url());

        const title = await sahibindenPage.title();
        console.log('📝 Title:', title);

        const bodyText = await sahibindenPage.evaluate(() => document.body.innerText.substring(0, 200).replace(/\n/g, ' '));
        console.log('📄 Body (First 200 chars):', bodyText);

        const isBlocked = title.includes('Olağan dışı') ||
            title.includes('Unusual') ||
            title.includes('Just a moment') ||
            bodyText.includes('Olağan dışı erişim');

        console.log('⚠️ BLOCK DETECTED?:', isBlocked ? 'YES' : 'NO');

        await browser.disconnect();
    } catch (e) {
        console.error('❌ Diagnostic Failed:', e.message);
    }
}

diagnose();
