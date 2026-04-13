const axios = require('axios');

async function testCors() {
    const url = 'http://127.0.0.1:5005/api/health';

    console.log('Testing authorized origin (http://localhost:5173)...');
    try {
        const res1 = await axios.get(url, {
            headers: { 'Origin': 'http://localhost:5173' }
        });
        console.log('✅ Authorized origin allowed:', res1.status);
    } catch (err) {
        console.error('❌ Authorized origin failed:', err.message);
    }

    console.log('\nTesting unauthorized origin (https://malicious.com)...');
    try {
        const res2 = await axios.get(url, {
            headers: { 'Origin': 'https://malicious.com' }
        });
        console.log('❌ Unauthorized origin allowed (VULNERABLE):', res2.status);
    } catch (err) {
        console.log('✅ Unauthorized origin rejected (SECURE):', err.message);
    }
}

testCors();
