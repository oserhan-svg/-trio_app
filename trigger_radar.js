
async function triggerApi() {
    console.log('--- TRIGGERING RADAR API ---');
    try {
        // Use localhost if running locally, or the server's internal address if in container
        // Assuming test-db worked on localhost:5005, we use that.
        const url = 'http://localhost:5006/api/properties';
        const params = {
            limit: 50,
            opportunity_filter: 'opportunity',
            radar_category: 'daire',
            // seller_type: undefined // axios ignores undefined keys
        };

        console.log(`GET ${url}`, params);

        // Use fetch if axios is not available in the context (as seen in prev error), 
        // OR try to require axios if it's in node_modules. 
        // Fallback to basic http if needed, but let's try standard fetch first (Node 18+).

        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${url}?${queryString}`;

        const response = await fetch(fullUrl);
        const data = await response.json();

        console.log(`Response Status: ${response.status}`);
        console.log(`Response Data Total: ${data.meta?.total}`);
        console.log(`Response Check: Found ${data.data?.length} items`);

        if (data.data?.length === 0) {
            console.log('❌ Still returning 0 items. Check backend logs for [RADAR] output.');
        } else {
            console.log('✅ Success! Found items.');
            console.log(JSON.stringify(data.data[0], null, 2));
        }

    } catch (e) {
        console.error('API Trigger Error:', e.message);
        if (e.cause) console.error(e.cause);
    }
}

triggerApi();
