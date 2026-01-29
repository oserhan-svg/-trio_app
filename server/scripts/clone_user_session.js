const fs = require('fs');
const path = require('path');
const scraperConfig = require('../config/scraperConfig');

async function cloneSession() {
    console.log('🕵️ Cloning User Session (Cookies)...');

    const sourcePath = 'C:\\Users\\ozanc\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies';

    // Determine bot's user data dir (from config or default)
    // In realBrowser.js we see it uses scraperConfig.paths.userDataDir
    // We need to resolve that.
    const botUserDataDir = scraperConfig.paths.userDataDir || path.join(__dirname, '../.puppeteer_profile');
    const destDir = path.join(botUserDataDir, 'Default', 'Network');
    const destPath = path.join(destDir, 'Cookies');

    if (!fs.existsSync(sourcePath)) {
        console.error('❌ Source Cookies file not found!');
        return;
    }

    // Checking if file is locked
    try {
        // Read access check
        fs.accessSync(sourcePath, fs.constants.R_OK);

        // Ensure destination dir exists
        if (!fs.existsSync(destDir)) {
            console.log(`📁 Creating destination directory: ${destDir}`);
            fs.mkdirSync(destDir, { recursive: true });
        }

        console.log(`📋 Copying from: ${sourcePath}`);
        console.log(`👉 To: ${destPath}`);

        // We use copyFile. valid even if locked for reading usually
        fs.copyFileSync(sourcePath, destPath);

        console.log('✅ Session Cookies CLONED successfully!');
        console.log('🚀 Now run the interactive scraper again. It should be logged in.');

    } catch (err) {
        if (err.code === 'EBUSY') {
            console.error('❌ FAILED: The Cookies file is LOCKED by Chrome.');
            console.error('💡 SOLUTION: You MUST close your main Chrome browser for just 5 seconds so I can copy the file.');
        } else {
            console.error('❌ Error copying cookies:', err.message);
        }
    }
}

cloneSession();
