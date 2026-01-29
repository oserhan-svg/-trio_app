const axios = require('axios');
const API_URL = 'http://localhost:5005/api';

async function testToggle() {
    try {
        console.log('Testing AI Toggle API directly...');
        // We need a token. Let's try to get one if we can, but usually we can't easily here.
        // But we can check if the route exists.
        const res = await axios.patch(`${API_URL}/whatsapp/clients/1/ai-toggle`, { ai_delegated: true }).catch(e => e.response);
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testToggle();
