const axios = require('axios');

async function testUnprotectedEndpoints() {
    const baseUrl = 'http://localhost:5005';

    console.log('Testing unprotected endpoints...');

    const endpoints = [
        { method: 'post', url: '/api/scraper/import', data: { listings: [], provider: 'test' } },
        { method: 'post', url: '/api/scraper/finished', data: { provider: 'test', reason: 'test' } },
        { method: 'post', url: '/api/whatsapp/extension-sync', data: { partnerName: 'test', messages: [] } }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.url}`,
                data: endpoint.data
            });
            console.log(`✅ [${endpoint.url}] is UNPROTECTED (Status: ${response.status}) - This is a security risk!`);
        } catch (error) {
            if (error.response) {
                console.log(`❌ [${endpoint.url}] returned ${error.response.status}. It might be protected.`);
            } else {
                console.log(`❌ [${endpoint.url}] failed: ${error.message}`);
            }
        }
    }
}

testUnprotectedEndpoints();
