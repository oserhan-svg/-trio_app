const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('----------------------------------------');
console.log('🧪 Testing WhatsApp Web.js Initialization');
console.log('----------------------------------------');

(async () => {
    try {
        console.log('1. Creating Client instance...');
        const client = new Client({
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        console.log('2. Setting up event listeners...');

        client.on('qr', (qr) => {
            console.log('✅ SUCCESS: QR Code received!');
            console.log('   (This means puppeteer launched and loaded WhatsApp Web successfully)');
            console.log('----------------------------------------');
            process.exit(0);
        });

        client.on('ready', () => {
            console.log('✅ SUCCESS: Client is ready!');
            process.exit(0);
        });

        client.on('auth_failure', msg => {
            console.error('❌ AUTH FAILURE:', msg);
            process.exit(1);
        });

        console.log('3. Initializing client (this may take a few seconds)...');
        await client.initialize();

    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
})();
