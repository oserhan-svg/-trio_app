const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

// Mock req, res, next
const createMockReq = (apiKey) => ({
    headers: {
        'x-extension-api-key': apiKey
    },
    ip: '127.0.0.1'
});

const createMockRes = () => {
    const res = {
        status: (code) => {
            res.statusCode = code;
            return res;
        },
        json: (data) => {
            res.body = data;
            return res;
        },
        statusCode: 200,
        body: null
    };
    return res;
};

const runTest = () => {
    console.log('🧪 Starting Extension Auth Middleware Tests...');

    const originalApiKey = process.env.EXTENSION_API_KEY;
    const testKey = 'test-secret-123';
    process.env.EXTENSION_API_KEY = testKey;

    let passed = 0;
    let total = 0;

    const assert = (condition, message) => {
        total++;
        if (condition) {
            console.log(`✅ [PASS] ${message}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${message}`);
        }
    };

    // Test 1: Successful Auth
    {
        const req = createMockReq(testKey);
        const res = createMockRes();
        let nextCalled = false;
        extensionAuth(req, res, () => { nextCalled = true; });
        assert(nextCalled === true, 'Next should be called with valid API key');
    }

    // Test 2: Missing API Key
    {
        const req = createMockReq(undefined);
        const res = createMockRes();
        let nextCalled = false;
        extensionAuth(req, res, () => { nextCalled = true; });
        assert(nextCalled === false, 'Next should NOT be called when API key is missing');
        assert(res.statusCode === 401, 'Should return 401 when API key is missing');
    }

    // Test 3: Invalid API Key
    {
        const req = createMockReq('wrong-key');
        const res = createMockRes();
        let nextCalled = false;
        extensionAuth(req, res, () => { nextCalled = true; });
        assert(nextCalled === false, 'Next should NOT be called with invalid API key');
        assert(res.statusCode === 403, 'Should return 403 with invalid API key');
    }

    // Test 4: Missing Server Key (Safety Check)
    {
        delete process.env.EXTENSION_API_KEY;
        const req = createMockReq(testKey);
        const res = createMockRes();
        let nextCalled = false;
        extensionAuth(req, res, () => { nextCalled = true; });
        assert(nextCalled === false, 'Next should NOT be called when server key is missing');
        assert(res.statusCode === 500, 'Should return 500 when server key is missing');
        process.env.EXTENSION_API_KEY = testKey;
    }

    console.log(`\n📊 Tests Summary: ${passed}/${total} passed`);

    // Restore env
    if (originalApiKey) process.env.EXTENSION_API_KEY = originalApiKey;
    else delete process.env.EXTENSION_API_KEY;

    if (passed !== total) {
        process.exit(1);
    }
};

runTest();
