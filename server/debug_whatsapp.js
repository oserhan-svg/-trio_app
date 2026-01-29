const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

console.log('--- WhatsApp Debugger Started ---');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, './.wwebjs_auth_debug') // Use a separate path for testing
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED! Scan this:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('CLIENT IS READY');
    process.exit(0);
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

console.log('Initializing...');
client.initialize().catch(err => {
    console.error('INITIALIZATION ERROR:', err);
});
