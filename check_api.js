const axios = require('axios');

async function check() {
    try {
        // We need a token. I'll try to find a way to bypass or just check the code more.
        // Actually, I can just check the database count.
        console.log('This script needs a token, skipping actual request.');
    } catch (e) {
        console.error(e);
    }
}
check();
