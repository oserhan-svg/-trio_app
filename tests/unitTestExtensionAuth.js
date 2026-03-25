const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

// Mock req, res, next
const createMockReq = (apiKey) => ({
    headers: { 'x-api-key': apiKey },
    ip: '127.0.0.1'
});

const createMockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const testExtensionAuth = () => {
    console.log('--- Testing extensionAuth Middleware ---');

    const serverKey = 'test-secret-key';
    process.env.EXTENSION_API_KEY = serverKey;

    // Test 1: Successful authentication
    console.log('Test 1: Successful authentication');
    const req1 = createMockReq(serverKey);
    const res1 = createMockRes();
    let nextCalled1 = false;
    extensionAuth(req1, res1, () => { nextCalled1 = true; });
    if (nextCalled1) {
        console.log('✅ Pass');
    } else {
        console.error('❌ Fail: Auth failed with correct key');
    }

    // Test 2: Missing API key
    console.log('Test 2: Missing API key');
    const req2 = createMockReq(undefined);
    const res2 = createMockRes();
    let nextCalled2 = false;
    extensionAuth(req2, res2, () => { nextCalled2 = true; });
    if (!nextCalled2 && res2.statusCode === 401) {
        console.log('✅ Pass');
    } else {
        console.error(`❌ Fail: Expected 401, got ${res2.statusCode}`);
    }

    // Test 3: Invalid API key
    console.log('Test 3: Invalid API key');
    const req3 = createMockReq('wrong-key');
    const res3 = createMockRes();
    let nextCalled3 = false;
    extensionAuth(req3, res3, () => { nextCalled3 = true; });
    if (!nextCalled3 && res3.statusCode === 401) {
        console.log('✅ Pass');
    } else {
        console.error(`❌ Fail: Expected 401, got ${res3.statusCode}`);
    }

    // Test 4: Missing server key (500 error)
    console.log('Test 4: Missing server key');
    delete process.env.EXTENSION_API_KEY;
    const req4 = createMockReq(serverKey);
    const res4 = createMockRes();
    let nextCalled4 = false;
    extensionAuth(req4, res4, () => { nextCalled4 = true; });
    if (!nextCalled4 && res4.statusCode === 500) {
        console.log('✅ Pass');
    } else {
        console.error(`❌ Fail: Expected 500, got ${res4.statusCode}`);
    }

    console.log('--- Test Finished ---');
};

testExtensionAuth();
