async function testAnalytics() {
    try {
        console.log('1. Logging in...');
        const authRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@emlak22.com',
                password: 'admin123'
            })
        });

        if (!authRes.ok) {
            throw new Error(`Login Failed: ${authRes.status} ${authRes.statusText}`);
        }

        const authData = await authRes.json();
        const token = authData.token;
        console.log('✅ Login success. Token acquired.');

        console.log('2. Requesting Analytics...');
        const analyticsRes = await fetch('http://127.0.0.1:5000/api/analytics', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Analytics Status:', analyticsRes.status);
        const text = await analyticsRes.text();
        try {
            const data = JSON.parse(text);
            console.log('Data Preview:', JSON.stringify(data).substring(0, 100));
        } catch (e) {
            console.log('Response Text (Not JSON):', text);
        }

    } catch (error) {
        console.error('❌ Request Failed:', error);
    }
}

testAnalytics();
