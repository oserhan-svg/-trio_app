const crypto = require('crypto');

// Mock request and response
const mockRes = () => {
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

const extensionAuth = require('../server/middleware/extensionAuth');

async function runTests() {
    console.log('--- Starting Extension Auth Middleware Tests ---');

    // Test Case 1: EXTENSION_KEY not set
    console.log('\nTest 1: Server key not set');
    delete process.env.EXTENSION_KEY;
    let req1 = { headers: {} };
    let res1 = mockRes();
    let nextCalled1 = false;
    extensionAuth(req1, res1, () => { nextCalled1 = true; });
    console.log('Result:', res1.statusCode === 500 ? 'PASS' : 'FAIL', '(Status 500)');
    console.log('Next Called:', nextCalled1 ? 'FAIL' : 'PASS');

    // Test Case 2: Missing header
    console.log('\nTest 2: Missing x-extension-key header');
    process.env.EXTENSION_KEY = 'secret-key';
    let req2 = { headers: {} };
    let res2 = mockRes();
    let nextCalled2 = false;
    extensionAuth(req2, res2, () => { nextCalled2 = true; });
    console.log('Result:', res2.statusCode === 401 ? 'PASS' : 'FAIL', '(Status 401)');
    console.log('Next Called:', nextCalled2 ? 'FAIL' : 'PASS');

    // Test Case 3: Invalid key
    console.log('\nTest 3: Invalid extension key');
    let req3 = { headers: { 'x-extension-key': 'wrong-key' }, ip: '127.0.0.1' };
    let res3 = mockRes();
    let nextCalled3 = false;
    extensionAuth(req3, res3, () => { nextCalled3 = true; });
    console.log('Result:', res3.statusCode === 403 ? 'PASS' : 'FAIL', '(Status 403)');
    console.log('Next Called:', nextCalled3 ? 'FAIL' : 'PASS');

    // Test Case 4: Valid key
    console.log('\nTest 4: Valid extension key');
    let req4 = { headers: { 'x-extension-key': 'secret-key' } };
    let res4 = mockRes();
    let nextCalled4 = false;
    extensionAuth(req4, res4, () => { nextCalled4 = true; });
    console.log('Next Called:', nextCalled4 ? 'PASS' : 'FAIL');

    // Test Case 5: Timing attack resistance (manual check of logic or just ensure it works)
    console.log('\nTest 5: Valid key (timingSafeEqual check)');
    let req5 = { headers: { 'x-extension-key': 'secret-key' } };
    let res5 = mockRes();
    let nextCalled5 = false;
    extensionAuth(req5, res5, () => { nextCalled5 = true; });
    console.log('Next Called:', nextCalled5 ? 'PASS' : 'FAIL');

    console.log('\n--- Extension Auth Middleware Tests Finished ---');
}

runTests().catch(console.error);
