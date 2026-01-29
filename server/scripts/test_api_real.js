
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBlbWxhazIyLmNvbSIsImlhdCI6MTc2OTI3NzM1NCwiZXhwIjoxNzY5MjgwOTU0fQ.skRTSifKuKQ-KVVeJv-dsvwCvYbOpHlxb_8Y-h7qr-g';

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/properties?limit=5',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY LENGTH:', data.length);
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                if (json.data && Array.isArray(json.data)) {
                    console.log(`Success! Received ${json.data.length} properties.`);
                    console.log('First property:', JSON.stringify(json.data[0], null, 2));
                } else {
                    console.log('Received JSON but unexpected format:', data.substring(0, 200));
                }
            } catch (e) {
                console.log('Failed to parse JSON:', e.message);
                console.log('Body:', data.substring(0, 200));
            }
        } else {
            console.log('Error Body:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
