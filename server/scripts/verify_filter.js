// Native fetch is available in Node 18+

async function check() {
    try {
        console.log('1. Authenticating...');
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
        console.log('✅ Login Successful.');

        console.log('2. Fetching with seller_type=owner...');
        const ownerReq = await fetch('http://127.0.0.1:5000/api/properties?seller_type=owner', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const owners = await ownerReq.json();
        console.log(`✅ Owner Listings: ${owners.length}`);

        console.log('3. Fetching with seller_type=office...');
        const officeReq = await fetch('http://127.0.0.1:5000/api/properties?seller_type=office', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const offices = await officeReq.json();
        console.log(`✅ Office Listings: ${offices.length}`);

        console.log('4. Fetching with seller_type=all...');
        const allReq = await fetch('http://127.0.0.1:5000/api/properties?seller_type=all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const all = await allReq.json();
        console.log(`✅ All Listings: ${all.length}`);

        console.log('5. (Cross-Filter) Owner + Sahibinden (Portal)...');
        const cross1 = await fetch('http://127.0.0.1:5000/api/properties?seller_type=owner&source=sahibinden', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cross1Json = await cross1.json();
        console.log(`✅ Owner + Sahibinden: ${cross1Json.length}`);

        console.log('6. (Cross-Filter) Owner + Hepsiemlak (Portal)...');
        const cross2 = await fetch('http://127.0.0.1:5000/api/properties?seller_type=owner&source=hepsiemlak', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cross2Json = await cross2.json();
        console.log(`✅ Owner + Hepsiemlak: ${cross2Json.length}`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
