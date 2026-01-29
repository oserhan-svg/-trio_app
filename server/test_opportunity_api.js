const axios = require('axios');

async function testOpportunityAPI() {
    const baseURL = 'http://localhost:5005/api'; // Port 5005 as found in server/index.js
    const categories = ['daire', 'villa', 'arsa', 'zeytinlik', 'tarla', 'commercial', 'tourism'];

    console.log('--- Testing Opportunity API ---');

    for (const cat of categories) {
        try {
            const response = await axios.get(`${baseURL}/properties`, {
                params: {
                    limit: 50,
                    opportunity_filter: 'opportunity',
                    radar_category: cat
                }
            });

            const data = response.data.data || [];
            console.log(`Category: ${cat.padEnd(10)} | Count: ${data.length}`);
            if (data.length > 0) {
                console.log(`   Sample Label: ${data[0].opportunity_label}`);
            }
        } catch (error) {
            console.error(`Error fetching ${cat}:`, error.message);
        }
    }
}

testOpportunityAPI();
