const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

// Mock request and response
const mockRequest = (apiKey) => ({
    headers: { 'x-api-key': apiKey },
    ip: '127.0.0.1'
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
    console.log('--- Testing Extension Authentication Middleware ---');

    // Test Case 1: EXTENSION_API_KEY not set
    process.env.EXTENSION_API_KEY = '';
    let req = mockRequest('any-key');
    let res = mockResponse();
    mockNext.called = false;

    extensionAuth(req, res, mockNext);
    console.log('Test Case 1 (No API Key in Env):', res.statusCode === 500 ? '✅ PASSED' : '❌ FAILED');

    // Test Case 2: No API key in header
    process.env.EXTENSION_API_KEY = 'secret-key';
    req = mockRequest(undefined);
    res = mockResponse();
    mockNext.called = false;

    extensionAuth(req, res, mockNext);
    console.log('Test Case 2 (No API Key in Header):', res.statusCode === 401 ? '✅ PASSED' : '❌ FAILED');

    // Test Case 3: Invalid API key
    req = mockRequest('wrong-key');
    res = mockResponse();
    mockNext.called = false;

    extensionAuth(req, res, mockNext);
    console.log('Test Case 3 (Invalid API Key):', res.statusCode === 403 ? '✅ PASSED' : '❌ FAILED');

    // Test Case 4: Valid API key
    req = mockRequest('secret-key');
    res = mockResponse();
    mockNext.called = false;

    extensionAuth(req, res, mockNext);
    console.log('Test Case 4 (Valid API Key):', mockNext.called ? '✅ PASSED' : '❌ FAILED');

    console.log('--- Extension Authentication Tests Completed ---');
}

testExtensionAuth().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
