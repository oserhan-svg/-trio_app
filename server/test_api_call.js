const axios = require('axios');

async function test() {
    try {
        console.log('--- CALLING API: /api/properties ---');
        const url = 'http://localhost:5000/api/properties?page=1&limit=50&category=all&listingType=all&seller_type=all&sort=newest';
        const response = await axios.get(url, {
            headers: { 'Authorization': 'Bearer ' + 'dummy_not_needed_if_patched_or_if_env_token_exists' }
        });

        console.log('Status:', response.status);
        console.log('Meta:', JSON.stringify(response.data.meta, null, 2));
        console.log('Data Length:', response.data.data ? response.data.data.length : 'N/A');

        if (response.data.data && response.data.data.length > 0) {
            console.log('First Item ID:', response.data.data[0].id);
            console.log('First Item District:', response.data.data[0].district);
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

test();
