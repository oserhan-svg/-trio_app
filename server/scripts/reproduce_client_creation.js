const TARGETS = [
    'http://localhost:10000',
    'https://trio-app-server.onrender.com'
];

async function testTarget(baseUrl) {
    console.log(`\n--- Testing Target: ${baseUrl} ---`);
    try {
        // 1. Login
        console.log('Logging in as admin...');
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@emlak22.com',
                password: 'admin123'
            })
        });

        if (!loginRes.ok) {
            console.error(`Login Failed: ${loginRes.status} ${loginRes.statusText}`);
            try {
                const txt = await loginRes.text();
                console.error('Response:', txt);
            } catch (e) { }
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login Successful. Token received.');

        // 2. Create Client
        console.log('Creating Test Client...');
        const clientData = {
            name: 'Test Client ' + Date.now(),
            phone: '0555 555 55 55',
            email: `test${Date.now()}@example.com`,
            notes: 'Created via repro script',
            type: 'buyer'
        };

        const createRes = await fetch(`${baseUrl}/api/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clientData)
        });

        if (!createRes.ok) {
            console.error(`Create Client Failed: ${createRes.status} ${createRes.statusText}`);
            try {
                const txt = await createRes.text();
                console.error('Response:', txt);
            } catch (e) { }
        } else {
            const client = await createRes.json();
            console.log('Client Created Successfully:', client.id, client.name);

            // Cleanup
            console.log('Cleaning up (Deleting Client)...');
            await fetch(`${baseUrl}/api/clients/${client.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Cleanup Done.');
        }

    } catch (e) {
        console.error(`Error testing ${baseUrl}:`, e.message);
    }
}

async function run() {
    for (const target of TARGETS) {
        await testTarget(target);
    }
}

run();
