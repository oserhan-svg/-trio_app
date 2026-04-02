const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

async function testExtensionAuth() {
    console.log('Running Extension Auth Tests...');

    const apiKey = 'test-api-key-123';
    process.env.EXTENSION_API_KEY = apiKey;

    const mockRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        }
    };

    // Test Case 1: Valid API Key
    console.log('Test 1: Valid API Key');
    let nextCalled = false;
    const req1 = { headers: { 'x-extension-api-key': apiKey }, ip: '127.0.0.1' };
    extensionAuth(req1, mockRes, () => { nextCalled = true; });
    if (nextCalled) console.log('✅ Success: Valid key accepted');
    else console.error('❌ Fail: Valid key rejected');

    // Test Case 2: Missing API Key
    console.log('Test 2: Missing API Key');
    nextCalled = false;
    const req2 = { headers: {}, ip: '127.0.0.1' };
    extensionAuth(req2, mockRes, () => { nextCalled = true; });
    if (!nextCalled && mockRes.statusCode === 401) console.log('✅ Success: Missing key rejected with 401');
    else console.error('❌ Fail: Missing key not handled correctly', mockRes.statusCode);

    // Test Case 3: Invalid API Key
    console.log('Test 3: Invalid API Key');
    nextCalled = false;
    const req3 = { headers: { 'x-extension-api-key': 'wrong-key' }, ip: '127.0.0.1' };
    extensionAuth(req3, mockRes, () => { nextCalled = true; });
    if (!nextCalled && mockRes.statusCode === 401) console.log('✅ Success: Invalid key rejected with 401');
    else console.error('❌ Fail: Invalid key not handled correctly', mockRes.statusCode);

    // Test Case 4: Missing Server Key
    console.log('Test 4: Missing Server Key');
    delete process.env.EXTENSION_API_KEY;
    nextCalled = false;
    const req4 = { headers: { 'x-extension-api-key': apiKey }, ip: '127.0.0.1' };
    extensionAuth(req4, mockRes, () => { nextCalled = true; });
    if (!nextCalled && mockRes.statusCode === 500) console.log('✅ Success: Missing server key rejected with 500');
    else console.error('❌ Fail: Missing server key not handled correctly', mockRes.statusCode);
}

testExtensionAuth().catch(console.error);
