const axios = require('axios');

async function testSecurity() {
    const baseUrl = 'http://localhost:5005';

    console.log('--- Testing Security Fixes ---');

    // 1. Test /api/deals/internal/migrate protection
    try {
        const response = await axios.get(`${baseUrl}/api/deals/internal/migrate`);
        console.log('❌ FAIL: /api/deals/internal/migrate is still accessible without auth');
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ PASS: /api/deals/internal/migrate returned 401 (Unauthorized)');
        } else {
            console.log(`❓ UNKNOWN: /api/deals/internal/migrate returned ${error.response ? error.response.status : error.message}`);
        }
    }

    // 2. Test if server still works
    try {
        const response = await axios.get(`${baseUrl}/api/health`);
        if (response.data.status === 'OK') {
            console.log('✅ PASS: Server is healthy');
        }
    } catch (error) {
        console.log('❌ FAIL: Server is not responding');
    }
}

testSecurity();
