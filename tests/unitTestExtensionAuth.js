const { extensionAuth } = require('../server/middleware/authMiddleware');
const crypto = require('crypto');

// Mock req, res, next
function createMocks(headers = {}, env = {}) {
    const req = { headers };
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        },
        sendStatus: function(code) {
            this.statusCode = code;
            return this;
        }
    };
    const next = () => { req.nextCalled = true; };

    // Backup and set env
    const oldEnv = process.env.EXTENSION_API_KEY;
    if (env.EXTENSION_API_KEY) process.env.EXTENSION_API_KEY = env.EXTENSION_API_KEY;
    else delete process.env.EXTENSION_API_KEY;

    return { req, res, next, cleanup: () => { process.env.EXTENSION_API_KEY = oldEnv; } };
}

async function runTests() {
    console.log('Testing extensionAuth middleware...');

    // 1. Fail if EXTENSION_API_KEY is not set
    {
        const { req, res, next, cleanup } = createMocks({ 'x-api-key': 'some-key' }, {});
        extensionAuth(req, res, next);
        if (res.statusCode === 500 && res.body.error === 'Server configuration error') {
            console.log('✅ Test 1 Passed: Correctly fails when EXTENSION_API_KEY is missing');
        } else {
            console.error('❌ Test 1 Failed', res.statusCode, res.body);
        }
        cleanup();
    }

    // 2. Fail if x-api-key header is missing
    {
        const { req, res, next, cleanup } = createMocks({}, { EXTENSION_API_KEY: 'secret-123' });
        extensionAuth(req, res, next);
        if (res.statusCode === 401 && res.body.error === 'API Key required') {
            console.log('✅ Test 2 Passed: Correctly fails when x-api-key header is missing');
        } else {
            console.error('❌ Test 2 Failed', res.statusCode, res.body);
        }
        cleanup();
    }

    // 3. Fail if API Key is invalid
    {
        const { req, res, next, cleanup } = createMocks({ 'x-api-key': 'wrong-key' }, { EXTENSION_API_KEY: 'secret-123' });
        extensionAuth(req, res, next);
        if (res.statusCode === 403 && res.body.error === 'Invalid API Key') {
            console.log('✅ Test 3 Passed: Correctly fails when invalid API key is provided');
        } else {
            console.error('❌ Test 3 Failed', res.statusCode, res.body);
        }
        cleanup();
    }

    // 4. Success if API Key is valid
    {
        const { req, res, next, cleanup } = createMocks({ 'x-api-key': 'secret-123' }, { EXTENSION_API_KEY: 'secret-123' });
        extensionAuth(req, res, next);
        if (req.nextCalled) {
            console.log('✅ Test 4 Passed: Correctly authorizes with valid API key');
        } else {
            console.error('❌ Test 4 Failed', res.statusCode, res.body);
        }
        cleanup();
    }

    // 5. Constant-time check logic (timingSafeEqual)
    // We can't easily test timing here, but we verified the logic uses hashing + timingSafeEqual
    console.log('Verification complete.');
}

runTests().catch(err => {
    console.error('Test runner failed:', err);
    process.exit(1);
});
