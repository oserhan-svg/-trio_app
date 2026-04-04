const http = require('http');

const testEndpoint = (path, key, expectedStatus) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5005,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(key ? { 'X-Extension-API-Key': key } : {})
            }
        };

        const req = http.request(options, (res) => {
            console.log(`Testing ${path} with ${key ? 'provided' : 'no'} key: Expected ${expectedStatus}, Got ${res.statusCode}`);
            if (res.statusCode === expectedStatus) {
                resolve(true);
            } else {
                resolve(false);
            }
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve(false);
        });

        req.write(JSON.stringify({ listings: [], provider: 'test' }));
        req.end();
    });
};

const runTests = async () => {
    // Note: EXTENSION_API_KEY must be set in the environment where the server is running.
    // For this test, we'll assume the server is NOT running and we'll just check the middleware logic
    // Or we could try to start a temporary server.

    // Better: create a unit test for the middleware.
    console.log("Starting security verification...");

    const mockReq = (key) => ({
        headers: { 'x-extension-api-key': key },
        method: 'POST',
        url: '/api/test'
    });

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

    const next = () => {
        console.log("Next called (Success)");
        return "SUCCESS";
    };

    process.env.EXTENSION_API_KEY = 'test-secret-key';
    const { extensionAuth } = require('../server/middleware/authMiddleware');

    console.log("\n--- Test 1: Valid Key ---");
    const res1 = mockRes();
    const result1 = extensionAuth(mockReq('test-secret-key'), res1, next);

    console.log("\n--- Test 2: Invalid Key ---");
    const res2 = mockRes();
    extensionAuth(mockReq('wrong-key'), res2, next);
    console.log("Got Status:", res2.statusCode);

    console.log("\n--- Test 3: Missing Key ---");
    const res3 = mockRes();
    extensionAuth(mockReq(undefined), res3, next);
    console.log("Got Status:", res3.statusCode);
};

runTests();
