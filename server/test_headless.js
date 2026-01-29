const { createStealthBrowser } = require('./services/browserFactory');

async function testHeadless() {
    console.log('👻 Testing HEADLESS Browser Launch...');
    try {
        // Force headless: true explicitly here
        const browser = await createStealthBrowser({ headless: true });
        console.log('✅ Browser launched in HEADLESS mode!');

        const page = await browser.newPage();
        console.log('🌍 Navigating to google.com...');
        await page.goto('https://www.google.com');

        const title = await page.title();
        console.log('📄 Page Title:', title);

        await browser.close();
        console.log('👋 Browser closed.');
    } catch (e) {
        console.error('❌ Browser FAILED to open even in HEADLESS mode:', e);
    }
}

testHeadless();
