async function check() {
    try {
        console.log('Checking API status...');
        const loginReq = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@emlak22.com', password: 'admin123' })
        });

        if (!loginReq.ok) {
            console.error('Login Failed:', await loginReq.text());
            return;
        }

        const { token } = await loginReq.json();
        console.log('Login Successful. Token acquired.');

        const propReq = await fetch('http://127.0.0.1:5000/api/properties', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!propReq.ok) {
            console.error('Properties Fetch Failed:', await propReq.text());
            return;
        }

        const properties = await propReq.json();
        console.log(`API returned ${properties.length} properties.`);
        if (properties.length > 0) {
            console.log('Sample:', properties[0].title);
        } else {
            console.log('Database seems empty.');
        }

    } catch (e) {
        console.error('Connection Error:', e.message);
    }
}

check();
