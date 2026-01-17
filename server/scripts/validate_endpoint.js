async function validate() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'danisman2@test.com',
                password: '123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token.');

        // 2. Call Refresh Endpoint
        console.log('Calling refresh endpoint...');
        const res = await fetch('http://localhost:5000/api/settings/refresh-rental-rate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status:', res.status);
        const data = await res.json();

        console.log('Body Type:', typeof data);
        console.log('Body Data:', JSON.stringify(data, null, 2));

        if (data && Array.isArray(data.data)) {
            console.log('VALIDATION SUCCESS: res.data.data is an array.');
        } else {
            console.log('VALIDATION FAILED: res.data.data is NOT an array.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

validate();
