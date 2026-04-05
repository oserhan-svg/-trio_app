const http = require('http');
const express = require('express');
const { extensionAuth } = require('../server/middleware/authMiddleware');

async function test() {
    const app = express();
    app.use(express.json());
    app.post('/test-secure', extensionAuth, (req, res) => {
        res.status(200).json({ success: true });
    });

    const server = app.listen(5099);

    const makeRequest = (headers) => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 5099,
                path: '/test-secure',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            }, (res) => {
                resolve(res.statusCode);
            });
            req.on('error', (e) => resolve(500));
            req.end();
        });
    };

    console.log('--- STARTING SECURITY VERIFICATION TESTS (NO SUPERTEST) ---');

    // 1. Test when EXTENSION_API_KEY is missing (Fail-Secure)
    delete process.env.EXTENSION_API_KEY;
    const res1 = await makeRequest({ 'X-Extension-API-Key': 'any-key' });
    console.log('Test 1 (No Server Key):', res1 === 500 ? '✅ PASSED (500 Internal Server Error)' : `❌ FAILED (${res1})`);

    // 2. Test when EXTENSION_API_KEY is set but client key is missing
    process.env.EXTENSION_API_KEY = 'secret-key-123';
    const res2 = await makeRequest({});
    console.log('Test 2 (Missing Client Key):', res2 === 401 ? '✅ PASSED (401 Unauthorized)' : `❌ FAILED (${res2})`);

    // 3. Test when client key is incorrect
    const res3 = await makeRequest({ 'X-Extension-API-Key': 'wrong-key' });
    console.log('Test 3 (Incorrect Client Key):', res3 === 401 ? '✅ PASSED (401 Unauthorized)' : `❌ FAILED (${res3})`);

    // 4. Test when client key is correct
    const res4 = await makeRequest({ 'X-Extension-API-Key': 'secret-key-123' });
    console.log('Test 4 (Correct Client Key):', res4 === 200 ? '✅ PASSED (200 OK)' : `❌ FAILED (${res4})`);

    console.log('--- SECURITY VERIFICATION TESTS COMPLETE ---');

    server.close();

    if (res1 === 500 && res2 === 401 && res3 === 401 && res4 === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
