async function testCRM() {
    console.log('--- Testing CRM API ---');

    try {
        // 1. LOGIN
        const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@emlak22.com', password: 'admin123' })
        });
        const { token } = await loginRes.json();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        console.log('✅ Login Token Acquired');

        // 2. CREATE CLIENT
        const createRes = await fetch('http://127.0.0.1:5000/api/clients', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test Client',
                phone: '5551234567',
                email: 'test@client.com',
                notes: 'Looking for villa'
            })
        });

        if (!createRes.ok) throw new Error('Create failed: ' + createRes.status);
        const newClient = await createRes.json();
        console.log('✅ Created Client:', newClient.id);

        // 3. UPDATE CLIENT
        const updateRes = await fetch(`http://127.0.0.1:5000/api/clients/${newClient.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ notes: 'Updated: Urgent villa' })
        });
        const updatedClient = await updateRes.json();
        console.log('✅ Updated Client Note:', updatedClient.notes);

        // 4. LIST CLIENTS
        const listRes = await fetch('http://127.0.0.1:5000/api/clients', { headers });
        const list = await listRes.json();
        console.log('✅ List Clients Count:', list.length);

        // 5. DELETE CLIENT
        const delRes = await fetch(`http://127.0.0.1:5000/api/clients/${newClient.id}`, {
            method: 'DELETE',
            headers
        });
        console.log('✅ Delete Status:', delRes.status);

    } catch (e) {
        console.error('❌ CRM Test Failed:', e);
    }
}

testCRM();
