const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

// Mock req, res, next
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
    let called = false;
    const next = () => {
        called = true;
    };
    next.wasCalled = () => called;
    return next;
};

async function testExtensionAuth() {
    console.log('Testing extensionAuth middleware...');
    process.env.EXTENSION_API_KEY = 'test-secret-key';

    // Test 1: Missing API Key
    let req = { headers: {} };
    let res = mockRes();
    let next = mockNext();
    extensionAuth(req, res, next);
    console.log('Test 1 (Missing Key):', res.statusCode === 401 ? 'PASSED' : 'FAILED');

    // Test 2: Correct API Key
    req = { headers: { 'x-extension-api-key': 'test-secret-key' } };
    res = mockRes();
    next = mockNext();
    extensionAuth(req, res, next);
    console.log('Test 2 (Correct Key):', next.wasCalled() ? 'PASSED' : 'FAILED');

    // Test 3: Incorrect API Key
    req = { headers: { 'x-extension-api-key': 'wrong-key' } };
    res = mockRes();
    next = mockNext();
    extensionAuth(req, res, next);
    console.log('Test 3 (Incorrect Key):', res.statusCode === 401 ? 'PASSED' : 'FAILED');

    // Test 4: Missing Server Key (Safety Check)
    delete process.env.EXTENSION_API_KEY;
    req = { headers: { 'x-extension-api-key': 'any-key' } };
    res = mockRes();
    next = mockNext();
    extensionAuth(req, res, next);
    console.log('Test 4 (Missing Server Key):', res.statusCode === 500 ? 'PASSED' : 'FAILED');
}

testExtensionAuth().catch(console.error);
