const http = require('http');

async function testHttp() {
    console.log('Sending HTTP POST request...');

    // Auth token needed?
    // The route is protected by authenticateToken.
    // We need to bypass it or provide a token.
    // However, for debugging we can check the server logs if it gets hit.
    // But login first is better.

    // Easier way: Login as admin then request.

    // Login
    const loginData = JSON.stringify({ email: 'admin@emlak22.com', password: 'admin123' });

    const token = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.token);
                } catch (e) { reject(e); }
            });
        });
        req.write(loginData);
        req.end();
    });

    console.log('Token acquired:', token ? 'Yes' : 'No');

    // Update Property
    const postData = JSON.stringify({ propertyId: 204, status: 'suggested' });
    const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/clients/3/properties', // Correct URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
            'Authorization': `Bearer ${token}`
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', data);
        });
    });

    req.write(postData);
    req.end();
}

testHttp();
