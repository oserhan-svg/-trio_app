const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

// Mock Request/Response
const mockRequest = (apiKey) => ({
    headers: {
        'x-api-key': apiKey
    }
});

const mockResponse = () => {
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
    mockNext.called = true;
};

async function testExtensionAuth() {
    process.env.EXTENSION_API_KEY = 'test-secret-key';

    console.log('Running extensionAuth unit tests...');

    // Test 1: Valid API Key
    mockNext.called = false;
    const req1 = mockRequest('test-secret-key');
    const res1 = mockResponse();
    extensionAuth(req1, res1, mockNext);
    if (mockNext.called) {
        console.log('✅ Test 1 Passed: Valid API Key allowed');
    } else {
        console.error('❌ Test 1 Failed: Valid API Key blocked');
    }

    // Test 2: Invalid API Key
    mockNext.called = false;
    const req2 = mockRequest('wrong-key');
    const res2 = mockResponse();
    extensionAuth(req2, res2, mockNext);
    if (!mockNext.called && res2.statusCode === 401) {
        console.log('✅ Test 2 Passed: Invalid API Key blocked');
    } else {
        console.error('❌ Test 2 Failed: Invalid API Key allowed or wrong status');
    }

    // Test 3: Missing API Key
    mockNext.called = false;
    const req3 = mockRequest(undefined);
    const res3 = mockResponse();
    extensionAuth(req3, res3, mockNext);
    if (!mockNext.called && res3.statusCode === 401) {
        console.log('✅ Test 3 Passed: Missing API Key blocked');
    } else {
        console.error('❌ Test 3 Failed: Missing API Key allowed or wrong status');
    }

    // Test 4: Missing Server API Key
    delete process.env.EXTENSION_API_KEY;
    mockNext.called = false;
    const req4 = mockRequest('any-key');
    const res4 = mockResponse();
    extensionAuth(req4, res4, mockNext);
    if (!mockNext.called && res4.statusCode === 500) {
        console.log('✅ Test 4 Passed: Missing server config returns 500');
    } else {
        console.error('❌ Test 4 Failed: Missing server config handled incorrectly');
    }
}

testExtensionAuth().catch(console.error);
