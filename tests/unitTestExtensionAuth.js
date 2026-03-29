const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

async function testExtensionAuth() {
    console.log('--- Testing extensionAuth Middleware ---');

    const mockRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        },
        warn: function(msg) {
            console.log('Mock Warn:', msg);
        }
    };

    const serverKey = 'test-secret-key-123';
    process.env.EXTENSION_API_KEY = serverKey;

    // Test 1: Missing API Key
    console.log('Test 1: Missing API Key');
    let nextCalled = false;
    const req1 = { headers: {}, ip: '127.0.0.1' };
    extensionAuth(req1, mockRes, () => { nextCalled = true; });
    if (mockRes.statusCode === 401 && mockRes.body.error === 'API Key required' && !nextCalled) {
        console.log('✅ Passed');
    } else {
        console.error('❌ Failed', { statusCode: mockRes.statusCode, body: mockRes.body, nextCalled });
    }

    // Test 2: Invalid API Key
    console.log('Test 2: Invalid API Key');
    nextCalled = false;
    const req2 = { headers: { 'x-api-key': 'wrong-key' }, ip: '127.0.0.1' };
    extensionAuth(req2, mockRes, () => { nextCalled = true; });
    if (mockRes.statusCode === 401 && mockRes.body.error === 'Invalid API Key' && !nextCalled) {
        console.log('✅ Passed');
    } else {
        console.error('❌ Failed', { statusCode: mockRes.statusCode, body: mockRes.body, nextCalled });
    }

    // Test 3: Valid API Key
    console.log('Test 3: Valid API Key');
    nextCalled = false;
    const req3 = { headers: { 'x-api-key': serverKey }, ip: '127.0.0.1' };
    extensionAuth(req3, mockRes, () => { nextCalled = true; });
    if (nextCalled) {
        console.log('✅ Passed');
    } else {
        console.error('❌ Failed', { nextCalled });
    }

    // Test 4: Missing Server Key (Environmental Error)
    console.log('Test 4: Missing Server Key');
    delete process.env.EXTENSION_API_KEY;
    nextCalled = false;
    const req4 = { headers: { 'x-api-key': serverKey }, ip: '127.0.0.1' };
    extensionAuth(req4, mockRes, () => { nextCalled = true; });
    if (mockRes.statusCode === 500 && mockRes.body.error === 'Server configuration error' && !nextCalled) {
        console.log('✅ Passed');
    } else {
        console.error('❌ Failed', { statusCode: mockRes.statusCode, body: mockRes.body, nextCalled });
    }

    console.log('--- Extension Auth Tests Finished ---');
}

testExtensionAuth().catch(console.error);
