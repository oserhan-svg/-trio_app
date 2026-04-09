const { extensionAuth } = require('../middleware/authMiddleware');

// Mock request, response, and next
const createMockReq = (headerKey) => ({
    headers: {
        'x-extension-api-key': headerKey
    }
});

const createMockRes = () => {
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

const runTest = (name, envKey, headerKey, expectedStatus, expectedNext) => {
    console.log(`Testing: ${name}`);

    // Set environment variable
    if (envKey) {
        process.env.EXTENSION_API_KEY = envKey;
    } else {
        delete process.env.EXTENSION_API_KEY;
    }

    const req = createMockReq(headerKey);
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    extensionAuth(req, res, next);

    if (expectedNext) {
        if (nextCalled) {
            console.log('✅ Success: next() was called');
        } else {
            console.error('❌ Fail: next() was not called');
            process.exit(1);
        }
    } else {
        if (res.statusCode === expectedStatus) {
            console.log(`✅ Success: status code is ${res.statusCode}`);
        } else {
            console.error(`❌ Fail: status code is ${res.statusCode}, expected ${expectedStatus}`);
            process.exit(1);
        }
    }
    console.log('-------------------');
};

// 1. Success case
runTest('Valid API Key', 'secret123', 'secret123', null, true);

// 2. Missing header
runTest('Missing API Key Header', 'secret123', undefined, 401, false);

// 3. Invalid key
runTest('Invalid API Key', 'secret123', 'wrong-key', 401, false);

// 4. Missing server config (fail-secure)
runTest('Missing Server-side Key', undefined, 'secret123', 500, false);

// 5. Short/Long comparison
runTest('Long vs Short Key', 'secret123', 's', 401, false);

console.log('All extensionAuth unit tests passed!');
