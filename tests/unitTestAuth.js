const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Target middleware to test
const extensionAuth = (req, res, next) => {
    const expectedKey = process.env.EXTENSION_API_KEY;

    if (!expectedKey) {
        return res.status(500).json({ error: 'Server authentication configuration error' });
    }

    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key required' });
    }

    try {
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest();
        const expectedKeyHash = crypto.createHash('sha256').update(expectedKey).digest();

        if (crypto.timingSafeEqual(apiKeyHash, expectedKeyHash)) {
            return next();
        }
    } catch (error) {}

    return res.status(403).json({ error: 'Invalid API Key' });
};

app.post('/test', extensionAuth, (req, res) => {
    res.json({ success: true });
});

const server = app.listen(5006, async () => {
    console.log('Test server running on port 5006');

    const http = require('http');
    const testRequest = (headers) => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 5006,
                path: '/test',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            }, (res) => {
                resolve(res.statusCode);
            });
            req.end(JSON.stringify({}));
        });
    };

    try {
        console.log('--- Testing without EXTENSION_API_KEY set ---');
        // process.env.EXTENSION_API_KEY is not set here yet (if started without it)
        const s0 = await testRequest({ 'x-api-key': 'any' });
        console.log(`Missing env var: ${s0 === 500 ? 'PASS' : 'FAIL (' + s0 + ')'}`);

        console.log('\n--- Testing with EXTENSION_API_KEY set ---');
        process.env.EXTENSION_API_KEY = 'test-secret-key';

        const s1 = await testRequest({});
        console.log(`No key header: ${s1 === 401 ? 'PASS' : 'FAIL (' + s1 + ')'}`);

        const s2 = await testRequest({ 'x-api-key': 'wrong' });
        console.log(`Wrong key: ${s2 === 403 ? 'PASS' : 'FAIL (' + s2 + ')'}`);

        const s3 = await testRequest({ 'x-api-key': 'test-secret-key' });
        console.log(`Correct key: ${s3 === 200 ? 'PASS' : 'FAIL (' + s3 + ')'}`);

        if (s0 === 500 && s1 === 401 && s2 === 403 && s3 === 200) {
            console.log('\n✅ UNIT TESTS PASSED ✅');
            process.exit(0);
        } else {
            console.log('\n❌ UNIT TESTS FAILED ❌');
            process.exit(1);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        server.close();
    }
});
