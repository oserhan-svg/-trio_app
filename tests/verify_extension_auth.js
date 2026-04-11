const express = require('express');
const request = require('supertest');
const { extensionAuth } = require('../server/middleware/authMiddleware');

// Mock environment
process.env.EXTENSION_API_KEY = 'test-secret-key';

const app = express();
app.use(express.json());

// Dummy endpoint to test the middleware
app.post('/test-protected', extensionAuth, (req, res) => {
    res.json({ success: true });
});

async function runTests() {
    console.log('--- Extension Auth Security Verification ---');

    // 1. Test missing API key
    console.log('Test 1: Missing API key...');
    const res1 = await request(app).post('/test-protected').send({});
    if (res1.status === 401 && res1.body.error === 'Extension API key required') {
        console.log('✅ PASS: Missing key rejected with 401');
    } else {
        console.error(`❌ FAIL: Expected 401, got ${res1.status}`, res1.body);
        process.exit(1);
    }

    // 2. Test wrong API key
    console.log('Test 2: Wrong API key...');
    const res2 = await request(app)
        .post('/test-protected')
        .set('X-Extension-API-Key', 'wrong-key')
        .send({});
    if (res2.status === 403 && res2.body.error === 'Invalid Extension API key') {
        console.log('✅ PASS: Wrong key rejected with 403');
    } else {
        console.error(`❌ FAIL: Expected 403, got ${res2.status}`, res2.body);
        process.exit(1);
    }

    // 3. Test correct API key
    console.log('Test 3: Correct API key...');
    const res3 = await request(app)
        .post('/test-protected')
        .set('X-Extension-API-Key', 'test-secret-key')
        .send({});
    if (res3.status === 200 && res3.body.success === true) {
        console.log('✅ PASS: Correct key accepted with 200');
    } else {
        console.error(`❌ FAIL: Expected 200, got ${res3.status}`, res3.body);
        process.exit(1);
    }

    // 4. Test missing EXTENSION_API_KEY in environment
    console.log('Test 4: Missing environment variable...');
    delete process.env.EXTENSION_API_KEY;
    const res4 = await request(app)
        .post('/test-protected')
        .set('X-Extension-API-Key', 'any-key')
        .send({});
    if (res4.status === 500 && res4.body.error === 'Server configuration error') {
        console.log('✅ PASS: Missing env var handled with 500');
    } else {
        console.error(`❌ FAIL: Expected 500, got ${res4.status}`, res4.body);
        process.exit(1);
    }

    console.log('\n✨ ALL SECURITY VERIFICATION TESTS PASSED');
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
