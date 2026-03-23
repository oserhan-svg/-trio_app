const { extensionAuth } = require('../server/middleware/authMiddleware');

/**
 * Mock Request, Response, Next for testing
 */
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    return res;
};

const mockNext = () => {
    const next = () => {
        next.called = true;
    };
    next.called = false;
    return next;
};

async function runTests() {
    console.log('🧪 Testing extensionAuth Middleware...\n');

    const originalKey = process.env.EXTENSION_API_KEY;
    const testKey = 'test-secret-key-123';
    process.env.EXTENSION_API_KEY = testKey;

    try {
        // Test Case 1: Valid API Key
        console.log('Test 1: Valid API Key');
        const req1 = { headers: { 'x-api-key': testKey } };
        const res1 = mockRes();
        const next1 = mockNext();
        extensionAuth(req1, res1, next1);
        if (next1.called) {
            console.log('✅ Pass: next() called for valid key');
        } else {
            console.error('❌ Fail: next() NOT called for valid key');
            process.exit(1);
        }

        // Test Case 2: Invalid API Key
        console.log('\nTest 2: Invalid API Key');
        const req2 = { headers: { 'x-api-key': 'wrong-key' } };
        const res2 = mockRes();
        const next2 = mockNext();
        extensionAuth(req2, res2, next2);
        if (!next2.called && res2.statusCode === 403) {
            console.log('✅ Pass: Returned 403 for invalid key');
        } else {
            console.error(`❌ Fail: Expected 403, got ${res2.statusCode}`);
            process.exit(1);
        }

        // Test Case 3: Missing API Key
        console.log('\nTest 3: Missing API Key');
        const req3 = { headers: {} };
        const res3 = mockRes();
        const next3 = mockNext();
        extensionAuth(req3, res3, next3);
        if (!next3.called && res3.statusCode === 401) {
            console.log('✅ Pass: Returned 401 for missing key');
        } else {
            console.error(`❌ Fail: Expected 401, got ${res3.statusCode}`);
            process.exit(1);
        }

        // Test Case 4: Missing Server Key (Configuration Error)
        console.log('\nTest 4: Missing Server Configuration (EXTENSION_API_KEY)');
        delete process.env.EXTENSION_API_KEY;
        const req4 = { headers: { 'x-api-key': testKey } };
        const res4 = mockRes();
        const next4 = mockNext();
        extensionAuth(req4, res4, next4);
        if (!next4.called && res4.statusCode === 500) {
            console.log('✅ Pass: Returned 500 for server configuration error');
        } else {
            console.error(`❌ Fail: Expected 500, got ${res4.statusCode}`);
            process.exit(1);
        }

        console.log('\n✨ All unit tests for extensionAuth passed successfully!');
    } finally {
        process.env.EXTENSION_API_KEY = originalKey;
    }
}

runTests().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
