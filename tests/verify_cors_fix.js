const http = require('http');
const express = require('express');
const cors = require('cors');

async function test() {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowedOrigins = [
                'https://trio-app.pages.dev',
                'https://trio-client.pages.dev',
                'http://localhost:5173',
                'http://localhost:3000'
            ];
            if (allowedOrigins.includes(origin) ||
                origin.includes('localhost') ||
                origin.startsWith('chrome-extension://')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    };

    const app = express();
    app.use(cors(corsOptions));
    app.get('/test-cors', (req, res) => res.json({ success: true }));

    const server = app.listen(5100);

    const makeRequest = (origin) => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 5100,
                path: '/test-cors',
                method: 'GET',
                headers: origin ? { 'Origin': origin } : {}
            }, (res) => {
                resolve(res.statusCode);
            });
            req.on('error', (e) => resolve('ERROR'));
            req.end();
        });
    };

    console.log('--- STARTING CORS VERIFICATION TESTS ---');

    const res1 = await makeRequest('http://localhost:5173');
    console.log('Test 1 (Allowed Origin):', res1 === 200 ? '✅ PASSED' : `❌ FAILED (${res1})`);

    const res2 = await makeRequest('chrome-extension://abc');
    console.log('Test 2 (Allowed Extension):', res2 === 200 ? '✅ PASSED' : `❌ FAILED (${res2})`);

    const res3 = await makeRequest('https://malicious.com');
    // Note: express-cors will return 200 but without Access-Control-Allow-Origin header if origin is not allowed,
    // OR it might throw error if configured to do so. In our index.js it passes an Error to callback.
    // When an error is passed to cors callback, it normally passes it to next(err).
    console.log('Test 3 (Blocked Origin):', res3 !== 200 ? '✅ PASSED (Blocked/Error)' : `❌ FAILED (Still 200)`);

    console.log('--- CORS VERIFICATION TESTS COMPLETE ---');

    server.close();
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
