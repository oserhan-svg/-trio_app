const { extensionAuth } = require('../middleware/authMiddleware');

async function testMiddleware() {
    console.log('--- Extension Auth Middleware Unit Test ---');

    const testKey = 'unit-test-key-123';
    process.env.EXTENSION_API_KEY = testKey;

    const mockRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.data = data;
            return this;
        }
    };

    // Test 1: No API Key
    let nextCalled = false;
    const req1 = { headers: {} };
    extensionAuth(req1, mockRes, () => { nextCalled = true; });
    if (!nextCalled && mockRes.statusCode === 401) {
        console.log('✅ PASS: No API key rejected with 401');
    } else {
        console.error(`❌ FAIL: No API key. nextCalled: ${nextCalled}, status: ${mockRes.statusCode}`);
    }

    // Test 2: Incorrect API Key
    nextCalled = false;
    const req2 = { headers: { 'x-extension-api-key': 'wrong' } };
    extensionAuth(req2, mockRes, () => { nextCalled = true; });
    if (!nextCalled && mockRes.statusCode === 401) {
        console.log('✅ PASS: Incorrect API key rejected with 401');
    } else {
        console.error(`❌ FAIL: Incorrect API key. nextCalled: ${nextCalled}, status: ${mockRes.statusCode}`);
    }

    // Test 3: Correct API Key
    nextCalled = false;
    const req3 = { headers: { 'x-extension-api-key': testKey } };
    extensionAuth(req3, mockRes, () => { nextCalled = true; });
    if (nextCalled) {
        console.log('✅ PASS: Correct API key accepted');
    } else {
        console.error(`❌ FAIL: Correct API key rejected. status: ${mockRes.statusCode}, data:`, mockRes.data);
    }

    // Test 4: Missing Server Configuration
    delete process.env.EXTENSION_API_KEY;
    nextCalled = false;
    const req4 = { headers: { 'x-extension-api-key': testKey } };
    extensionAuth(req4, mockRes, () => { nextCalled = true; });
    if (!nextCalled && mockRes.statusCode === 500) {
        console.log('✅ PASS: Missing server config rejected with 500');
    } else {
        console.error(`❌ FAIL: Missing server config. nextCalled: ${nextCalled}, status: ${mockRes.statusCode}`);
    }
}

testMiddleware().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
