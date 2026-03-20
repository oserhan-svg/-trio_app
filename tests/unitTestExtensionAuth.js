const crypto = require('crypto');
const extensionAuth = require('../server/middleware/extensionAuth');

// Mock request and response
function runTest() {
    console.log('--- Starting Extension Auth Middleware Tests ---');
    let testsPassed = 0;
    let totalTests = 0;

    const testApiKey = 'test-secret-key';
    process.env.EXTENSION_API_KEY = testApiKey;

    const mockNext = () => { mockNext.called = true; };
    mockNext.called = false;

    const mockRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.body = data; return this; }
    };

    // Test 1: Valid API Key
    totalTests++;
    mockNext.called = false;
    const req1 = { headers: { 'x-api-key': testApiKey }, ip: '127.0.0.1' };
    extensionAuth(req1, mockRes, mockNext);
    if (mockNext.called) {
        console.log('✅ Test 1: Valid API Key passed');
        testsPassed++;
    } else {
        console.error('❌ Test 1: Valid API Key failed');
    }

    // Test 2: Invalid API Key
    totalTests++;
    mockNext.called = false;
    const req2 = { headers: { 'x-api-key': 'wrong-key' }, ip: '127.0.0.1' };
    extensionAuth(req2, mockRes, mockNext);
    if (!mockNext.called && mockRes.statusCode === 401 && mockRes.body.error.includes('Invalid API Key')) {
        console.log('✅ Test 2: Invalid API Key passed');
        testsPassed++;
    } else {
        console.error('❌ Test 2: Invalid API Key failed');
    }

    // Test 3: Missing API Key
    totalTests++;
    mockNext.called = false;
    const req3 = { headers: {}, ip: '127.0.0.1' };
    extensionAuth(req3, mockRes, mockNext);
    if (!mockNext.called && mockRes.statusCode === 401 && mockRes.body.error.includes('Missing API Key')) {
        console.log('✅ Test 3: Missing API Key passed');
        testsPassed++;
    } else {
        console.error('❌ Test 3: Missing API Key failed');
    }

    // Test 4: Missing Environment Variable
    totalTests++;
    delete process.env.EXTENSION_API_KEY;
    mockNext.called = false;
    const req4 = { headers: { 'x-api-key': testApiKey }, ip: '127.0.0.1' };
    extensionAuth(req4, mockRes, mockNext);
    if (!mockNext.called && mockRes.statusCode === 500 && mockRes.body.error === 'Internal Server Error') {
        console.log('✅ Test 4: Missing Environment Variable passed');
        testsPassed++;
    } else {
        console.error('❌ Test 4: Missing Environment Variable failed');
    }

    console.log(`--- Tests Finished: ${testsPassed}/${totalTests} passed ---`);
    if (testsPassed !== totalTests) process.exit(1);
}

runTest();
