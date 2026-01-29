const { createStealthBrowser } = require('./services/browserFactory');

async function testVisible() {
    console.log('👀 Testing Visible Browser Launch (v4)...');
    try {
        // Force headless: false explicitly here
        const browser = await createStealthBrowser({ headless: false });
        console.log('✅ Browser launched! Creating page...');

        const page = await browser.newPage();

        // Add config step to match scraperService behavior
        console.log('⚙️ Configuring stealth page...');
        const { configureStealthPage } = require('./services/browserFactory');
        await configureStealthPage(page);
        console.log('✅ Configuration done.');

        console.log('🌍 Navigating to google.com...');
        await page.goto('https://www.google.com');

        console.log('✅ Success! Browser is open and visible.');
        console.log('⏳ Waiting 10 seconds before closing...');
        await new Promise(r => setTimeout(r, 10000));

        await browser.close();
        console.log('👋 Browser closed.');
    } catch (e) {
        console.error('❌ Browser FAILED to open:', e);
    }
}

testVisible();
