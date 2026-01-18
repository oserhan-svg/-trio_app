const jwt = require('jsonwebtoken');

async function testApiFilter() {
    try {
        const token = jwt.sign({ id: 1, role: 'admin' }, 'your_jwt_secret_key', { expiresIn: '1h' });

        console.log("Fetching: http://localhost:5000/api/properties?seller_type=owner");
        const res = await fetch('http://localhost:5000/api/properties?seller_type=owner', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        }

        const json = await res.json();
        let data = json.data || json; // Handle pagination format

        console.log(`API returned ${data.length} listings.`);

        let failures = 0;
        data.forEach(p => {
            if (p.seller_type !== 'owner') {
                console.error(`[FAIL] ID: ${p.id} is type '${p.seller_type}' (Expected: owner)`);
                failures++;
            }
        });

        if (failures === 0) {
            console.log("SUCCESS: All returned listings are 'owner'.");
        } else {
            console.log(`FAILURE: Found ${failures} non-owner listings.`);
        }

    } catch (e) {
        console.error("API Request Failed:", e.message);
    }
}

testApiFilter();
