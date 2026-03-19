
const VALID_KEY = 'test-secret-key';
const INVALID_KEY = 'wrong-key';

async function runTests() {
    console.log('--- EXTENSION AUTH VERIFICATION ---');

    // Set environment variable for the test
    process.env.EXTENSION_API_KEY = VALID_KEY;

    // Test the middleware function itself by mocking req/res.
    const extensionAuth = require('../server/middleware/extensionAuth');

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

    // Test 1: No Key
    console.log('Test 1: Request without API Key...');
    let req1 = { headers: {} };
    let res1 = mockRes();
    let next1Called = false;
    extensionAuth(req1, res1, () => { next1Called = true; });
    if (res1.statusCode === 401 && !next1Called) {
        console.log('✅ Correct: Returned 401');
    } else {
        console.error('❌ Failed: Should return 401. Status:', res1.statusCode, 'Next called:', next1Called);
    }

    // Test 2: Valid Key
    console.log('Test 2: Request with VALID API Key...');
    let req2 = { headers: { 'x-api-key': VALID_KEY } };
    let res2 = mockRes();
    let next2Called = false;
    extensionAuth(req2, res2, () => { next2Called = true; });
    if (next2Called) {
        console.log('✅ Correct: next() called');
    } else {
        console.error('❌ Failed: next() should be called. Status:', res2.statusCode);
    }

    // Test 3: Invalid Key
    console.log('Test 3: Request with INVALID API Key...');
    let req3 = { headers: { 'x-api-key': INVALID_KEY } };
    let res3 = mockRes();
    let next3Called = false;
    extensionAuth(req3, res3, () => { next3Called = true; });
    if (res3.statusCode === 403 && !next3Called) {
        console.log('✅ Correct: Returned 403');
    } else {
        console.error('❌ Failed: Should return 403. Status:', res3.statusCode, 'Next called:', next3Called);
    }

    // Test 4: Missing Server Key
    console.log('Test 4: Server missing EXTENSION_API_KEY...');
    delete process.env.EXTENSION_API_KEY;
    let req4 = { headers: { 'x-api-key': VALID_KEY } };
    let res4 = mockRes();
    let next4Called = false;
    extensionAuth(req4, res4, () => { next4Called = true; });
    if (res4.statusCode === 500 && !next4Called) {
        console.log('✅ Correct: Returned 500');
    } else {
        console.error('❌ Failed: Should return 500. Status:', res4.statusCode, 'Next called:', next4Called);
    }

    console.log('--- VERIFICATION COMPLETE ---');
}

runTests().catch(console.error);
