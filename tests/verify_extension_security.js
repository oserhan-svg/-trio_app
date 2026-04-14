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

const mockReq = (headers) => ({
  headers: headers || {}
});

console.log('--- Starting Extension Security Middleware Tests ---');

// Test 1: Missing Environment Variable
delete process.env.EXTENSION_API_KEY;
let req = mockReq({ 'x-api-key': 'any' });
let res = mockRes();
extensionAuth(req, res, () => {});
if (res.statusCode === 500) {
    console.log('✅ Test 1 Passed: Missing EXTENSION_API_KEY blocked with 500');
} else {
    console.error('❌ Test 1 Failed: Missing EXTENSION_API_KEY should block with 500, got:', res.statusCode);
    process.exit(1);
}

// Set up for remaining tests
process.env.EXTENSION_API_KEY = 'secret-test-key-123';

// Test 2: No API Key in Header
req = mockReq({});
res = mockRes();
extensionAuth(req, res, () => {});
if (res.statusCode === 401) {
    console.log('✅ Test 2 Passed: No API Key blocked with 401');
} else {
    console.error('❌ Test 2 Failed: No API Key should block with 401, got:', res.statusCode);
    process.exit(1);
}

// Test 3: Wrong API Key
req = mockReq({ 'x-api-key': 'wrong-password' });
res = mockRes();
extensionAuth(req, res, () => {});
if (res.statusCode === 401) {
    console.log('✅ Test 3 Passed: Wrong API Key blocked with 401');
} else {
    console.error('❌ Test 3 Failed: Wrong API Key should block with 401, got:', res.statusCode);
    process.exit(1);
}

// Test 4: Correct API Key
req = mockReq({ 'x-api-key': 'secret-test-key-123' });
res = mockRes();
let nextCalled = false;
extensionAuth(req, res, () => { nextCalled = true; });
if (nextCalled) {
    console.log('✅ Test 4 Passed: Correct API Key allowed');
} else {
    console.error('❌ Test 4 Failed: Correct API Key blocked');
    process.exit(1);
}

// Test 5: Different Length Key (Timing Attack Resistance)
req = mockReq({ 'x-api-key': 'short' });
res = mockRes();
extensionAuth(req, res, () => {});
if (res.statusCode === 401) {
    console.log('✅ Test 5 Passed: Short key blocked');
} else {
    console.error('❌ Test 5 Failed: Short key should block');
    process.exit(1);
}

console.log('\n🛡️ All extension security middleware tests passed successfully!');
