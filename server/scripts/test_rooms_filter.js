const loginUrl = 'http://localhost:5000/api/auth/login';
const propertiesUrl = 'http://localhost:5000/api/properties';

async function testFilter() {
    try {
        // 1. Login
        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@emlak22.com',
                password: 'admin123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        // 2. Test 3+1
        const queryParams = new URLSearchParams({ rooms: '3+1' });
        console.log('Testing rooms=3+1...');
        const res = await fetch(`${propertiesUrl}?${queryParams}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        console.log(`Got ${data.length} listings.`);
        data.slice(0, 5).forEach(p => console.log(`${p.id}: ${p.title} [${p.rooms}]`));

        // Verify if any have WRONG rooms
        const wrong = data.filter(p => p.rooms.replace(/\s/g, '') !== '3+1');
        if (wrong.length > 0) {
            console.log('FAILED: Found listings causing mismatch:', wrong.map(p => `${p.rooms}`).join(', '));
        } else {
            console.log('SUCCESS: All filtered listings match 3+1.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testFilter();
