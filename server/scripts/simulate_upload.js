// Axios removed
const http = require('http');

const PORT = 5000;
const EMAIL = 'admin@emlak22.com';
const PASSWORD = '1234';

// Helper for making requests
function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, body: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body, headers: res.headers }); // Raw body if not JSON
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function simulate() {
    console.log('--- STARTING SIMULATION ---');

    console.log('1. Logging in...');
    try {
        const loginRes = await request({
            host: 'localhost',
            port: PORT,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: EMAIL, password: PASSWORD });

        if (loginRes.status !== 200) {
            console.error('Login Failed:', loginRes.body);
            return;
        }

        const token = loginRes.body.token;
        console.log('Login Success. Token acquired.');

        console.log('2. Uploading Data to /api/clients/bulk ...');
        const uploadRes = await request({
            host: 'localhost',
            port: PORT,
            path: '/api/clients/bulk',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, [
            { name: "Test User 1", phone: "05551112233", email: "test1@example.com", notes: "Imported" },
            { name: "Test User 2", phone: "05554445566", email: "test2@example.com", notes: "Imported" }
        ]);

        console.log('Upload Response:', uploadRes.status, uploadRes.body);

        console.log('3. Fetching Pending List from /api/clients/pending/list ...');
        const listRes = await request({
            host: 'localhost',
            port: PORT,
            path: '/api/clients/pending/list',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('List Response Status:', listRes.status);
        if (Array.isArray(listRes.body)) {
            console.log(`Found ${listRes.body.length} pending contacts.`);
            console.log('Sample:', listRes.body[0]);
        } else {
            console.log('Body:', listRes.body);
        }

    } catch (e) {
        console.error('Simulation Error:', e.message);
    }
}

simulate();
