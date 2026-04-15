const assert = require('assert');
const extensionAuth = require('../server/middleware/extensionAuth');
const crypto = require('crypto');

async function testExtensionAuth() {
    console.log('Testing ExtensionAuth Middleware...');

    // Mock response object
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

    // 1. Test missing EXTENSION_API_KEY
    process.env.EXTENSION_API_KEY = '';
    let req = { headers: {} };
    let res = mockRes();
    let nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 500, 'Should return 500 if EXTENSION_API_KEY is missing');
    assert.strictEqual(res.body.code, 'MISSING_EXTENSION_KEY');
    assert.strictEqual(nextCalled, false);

    // 2. Test missing x-api-key header
    process.env.EXTENSION_API_KEY = 'test-secret-key';
    req = { headers: {} };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401, 'Should return 401 if x-api-key header is missing');
    assert.strictEqual(res.body.code, 'API_KEY_REQUIRED');
    assert.strictEqual(nextCalled, false);

    // 3. Test wrong x-api-key header
    req = { headers: { 'x-api-key': 'wrong-key' }, ip: '127.0.0.1' };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401, 'Should return 401 if x-api-key is wrong');
    assert.strictEqual(res.body.code, 'INVALID_API_KEY');
    assert.strictEqual(nextCalled, false);

    // 4. Test correct x-api-key header
    req = { headers: { 'x-api-key': 'test-secret-key' } };
    res = mockRes();
    nextCalled = false;
    extensionAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Should call next() if x-api-key is correct');
    assert.strictEqual(res.statusCode, undefined);

    console.log('✅ ExtensionAuth Middleware tests passed!');
}

async function runTests() {
    try {
        await testExtensionAuth();
        console.log('\nAll security verification tests passed! 🛡️');
    } catch (error) {
        console.error('\n❌ Security verification failed:');
        console.error(error);
        process.exit(1);
    }
}

runTests();
