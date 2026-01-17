async function test() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'danisman2@test.com',
                password: '123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login Failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful, token obtained.');

        // 2. Create Client
        const clientData = {
            name: 'API Test User Fetch',
            phone: '5551234567',
            email: 'apitestfetch@example.com',
            notes: 'Testing API Fetch',
            type: 'seller'
        };

        const createRes = await fetch('http://localhost:5000/api/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clientData)
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            console.error('API Error Status:', createRes.status);
            console.error('API Error Response:', errText);
        } else {
            const data = await createRes.json();
            console.log('Client Created Successfully:', data);
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

test();
