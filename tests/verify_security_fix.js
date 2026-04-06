const axios = require('../server/node_modules/axios');

async function testSecurity() {
    const baseUrl = 'http://localhost:5005';
    const testKey = 'test-secret-key';

    // Set the environment variable for the test (on the server side)
    process.env.EXTENSION_API_KEY = testKey;

    console.log('Testing security with EXTENSION_API_KEY set to:', testKey);

    const endpoints = [
        { method: 'post', url: '/api/scraper/import', data: { listings: [], provider: 'test' } },
        { method: 'post', url: '/api/scraper/finished', data: { provider: 'test', reason: 'test' } },
        { method: 'post', url: '/api/whatsapp/extension-sync', data: { partnerName: 'test', messages: [] } }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n--- Testing ${endpoint.url} ---`);

        // 1. Test without key
        try {
            await axios({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.url}`,
                data: endpoint.data
            });
            console.log(`❌ FAIL: [${endpoint.url}] allowed access without key!`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ PASS: [${endpoint.url}] blocked access without key (401).`);
            } else {
                console.log(`❓ UNKNOWN: [${endpoint.url}] returned ${error.response ? error.response.status : error.message} without key.`);
            }
        }

        // 2. Test with wrong key
        try {
            await axios({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.url}`,
                data: endpoint.data,
                headers: { 'X-Extension-API-Key': 'wrong-key' }
            });
            console.log(`❌ FAIL: [${endpoint.url}] allowed access with wrong key!`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ PASS: [${endpoint.url}] blocked access with wrong key (401).`);
            } else {
                console.log(`❓ UNKNOWN: [${endpoint.url}] returned ${error.response ? error.response.status : error.message} with wrong key.`);
            }
        }

        // 3. Test with correct key
        try {
            const response = await axios({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.url}`,
                data: endpoint.data,
                headers: { 'X-Extension-API-Key': testKey }
            });
            if (response.status === 200) {
                console.log(`✅ PASS: [${endpoint.url}] allowed access with correct key (200).`);
            } else {
                console.log(`❌ FAIL: [${endpoint.url}] returned ${response.status} with correct key.`);
            }
        } catch (error) {
            console.log(`❌ FAIL: [${endpoint.url}] blocked access with correct key: ${error.response ? error.response.status : error.message}`);
            if (error.response) console.log('Response data:', error.response.data);
        }
    }
}

testSecurity();
