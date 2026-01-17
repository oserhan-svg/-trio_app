// Native fetch is available in Node 24.
// Native fetch is available in Node 24.

const BASE_URL = 'http://localhost:5000/api';

async function main() {
    console.log('🧪 Testing Manual Scrape Trigger...');

    try {
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test_api@example.com', password: '123456' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        const { token } = await loginRes.json();
        console.log('✅ Login Token Acquired');

        // 2. Trigger Scrape
        console.log('🚀 Sending POST /properties/scrape...');
        const scrapeRes = await fetch(`${BASE_URL}/properties/scrape`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!scrapeRes.ok) {
            const errText = await scrapeRes.text();
            throw new Error(`Scrape trigger failed: ${scrapeRes.status} - ${errText}`);
        }

        const data = await scrapeRes.json();
        console.log('✅ Scrape Triggered Successfully:', data);

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main();
