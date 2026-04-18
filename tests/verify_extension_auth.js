const extensionAuth = require('../server/middleware/extensionAuth');

// Mock req, res, next
function createMocks(headerKey, envKey) {
    const req = {
        headers: {
            'x-extension-key': headerKey
        },
        ip: '127.0.0.1'
    };
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        }
    };
    const next = jest ? jest.fn() : () => { req.nextCalled = true; };

    if (envKey === undefined) {
        delete process.env.EXTENSION_API_KEY;
    } else {
        process.env.EXTENSION_API_KEY = envKey;
    }

    return { req, res, next };
}

async function runTests() {
    console.log('🧪 Running Extension Auth Middleware Tests...');

    // Test 1: Success with correct key
    {
        const { req, res, next } = createMocks('correct-key', 'correct-key');
        extensionAuth(req, res, next);
        if (req.nextCalled) {
            console.log('✅ Test 1 Passed: Correct key allowed');
        } else {
            console.error('❌ Test 1 Failed: Correct key blocked');
        }
    }

    // Test 2: Failure with incorrect key
    {
        const { req, res, next } = createMocks('wrong-key', 'correct-key');
        extensionAuth(req, res, next);
        if (res.statusCode === 401 && res.body.error === 'Invalid extension API key') {
            console.log('✅ Test 2 Passed: Incorrect key blocked with 401');
        } else {
            console.error('❌ Test 2 Failed: Incorrect key not handled correctly', res.statusCode, res.body);
        }
    }

    // Test 3: Failure with missing key
    {
        const { req, res, next } = createMocks(undefined, 'correct-key');
        extensionAuth(req, res, next);
        if (res.statusCode === 401 && res.body.error === 'Extension API key required') {
            console.log('✅ Test 3 Passed: Missing key blocked with 401');
        } else {
            console.error('❌ Test 3 Failed: Missing key not handled correctly', res.statusCode, res.body);
        }
    }

    // Test 4: Failure with unconfigured server key
    {
        const { req, res, next } = createMocks('any-key', undefined);
        extensionAuth(req, res, next);
        if (res.statusCode === 500 && res.body.error === 'Server authentication misconfiguration') {
            console.log('✅ Test 4 Passed: Unconfigured server key handled with 500');
        } else {
            console.error('❌ Test 4 Failed: Unconfigured server key not handled correctly', res.statusCode, res.body);
        }
    }

    // Test 5: Timing safe comparison (simulated)
    // Both hashes should be created even if lengths differ
    {
        const { req, res, next } = createMocks('short', 'very-long-key-to-test-length-handling');
        extensionAuth(req, res, next);
        if (res.statusCode === 401) {
            console.log('✅ Test 5 Passed: Different length keys handled correctly');
        } else {
            console.error('❌ Test 5 Failed: Different length keys caused error');
        }
    }
}

// Minimal jest mock if needed
const jest = typeof global.jest !== 'undefined';

runTests().catch(err => {
    console.error('Test Execution Error:', err);
    process.exit(1);
});
