async function testMatching() {
    console.log('--- Testing Smart Matching ---');

    try {
        // 1. Login
        const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@emlak22.com', password: 'admin123' })
        });
        const { token } = await loginRes.json();
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Create Client looking for 'Kelepir' or specific price
        const clientRes = await fetch('http://127.0.0.1:5000/api/clients', {
            method: 'POST',
            body: JSON.stringify({ name: 'Match Seeker', phone: '111', notes: 'Testing algo' }),
            headers
        });
        const client = await clientRes.json();
        console.log('✅ Created Client:', client.id);

        // 3. Add Demand (Broad enough to find something)
        // Adjust these values based on actual DB data if known, otherwise typical values
        await fetch(`http://127.0.0.1:5000/api/clients/${client.id}/demands`, {
            method: 'POST',
            body: JSON.stringify({ max_price: 15000000, rooms: '2+1' }), // Assuming there's a 2+1 under 15M
            headers
        });
        console.log('✅ Added Demand: 2+1, Max 15M');

        // 4. Get Matches
        const matchRes = await fetch(`http://127.0.0.1:5000/api/clients/${client.id}/matches`, { headers });
        const matches = await matchRes.json();

        console.log(`✅ Matches Found: ${matches.length}`);
        if (matches.length > 0) {
            console.log('Sample Match:', matches[0].title, matches[0].price);
            console.log('Reason:', matches[0].matchReason);
        }

        // Cleanup
        await fetch(`http://127.0.0.1:5000/api/clients/${client.id}`, { method: 'DELETE', headers });

    } catch (e) {
        console.error('❌ Matching Test Failed:', e);
    }
}

testMatching();
