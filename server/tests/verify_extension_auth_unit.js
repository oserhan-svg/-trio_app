const { extensionAuth } = require('../middleware/authMiddleware');

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

const test = () => {
    console.log('--- Testing extensionAuth Middleware ---');

    // Test Case 1: Missing EXTENSION_API_KEY in environment
    process.env.EXTENSION_API_KEY = '';
    let req = { headers: {} };
    let res = mockRes();
    let nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    console.log('Test 1 (Missing Server Key):', res.statusCode === 500 ? 'PASSED' : 'FAILED');

    // Test Case 2: Missing header
    process.env.EXTENSION_API_KEY = 'test-secret-key';
    req = { headers: {} };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    console.log('Test 2 (Missing Header):', res.statusCode === 401 ? 'PASSED' : 'FAILED');

    // Test Case 3: Invalid Key (different length)
    req = { headers: { 'x-extension-api-key': 'wrong' } };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    console.log('Test 3 (Invalid Key - Length):', res.statusCode === 401 ? 'PASSED' : 'FAILED');

    // Test Case 4: Invalid Key (same length)
    req = { headers: { 'x-extension-api-key': 'test-secret-kay' } };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    console.log('Test 4 (Invalid Key - Content):', res.statusCode === 401 ? 'PASSED' : 'FAILED');

    // Test Case 5: Valid Key
    req = { headers: { 'x-extension-api-key': 'test-secret-key' } };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    console.log('Test 5 (Valid Key):', nextCalled === true ? 'PASSED' : 'FAILED');

    console.log('--- Tests Completed ---');
};

test();
