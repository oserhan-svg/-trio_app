
const { getProperties } = require('../controllers/propertyController');
const prisma = require('../db');

// Mock Req/Res
const mockReq = (query = {}) => ({ query, user: { id: 1 } });
const mockRes = () => {
    const res = {};
    res.headers = {};
    res.statusCode = 200;

    res.status = (code) => {
        res.statusCode = code;
        return res;
    };

    res.json = (data) => {
        res.data = data;
        return res;
    };

    res.setHeader = (key, val) => {
        res.headers[key] = val;
        return res;
    };

    return res;
};

async function testEmptyIds() {
    console.log('--- Testing Empty/Invalid IDs Param ---');
    try {
        // Case 1: Invalid IDs string -> resulting in empty ID list
        // Current suspected behavior: Returns ALL properties (limit 50)
        // Desired behavior: Returns 0 properties

        console.log("Test 1: ?ids=invalid_string");
        const req1 = mockReq({ ids: 'invalid_string' });
        const res1 = mockRes();
        await getProperties(req1, res1);

        const data1 = res1.data.data || res1.data;
        console.log(`Result count: ${data1.length}`);
        if (data1.length > 5) {
            console.log("FAIL: Returned many properties (fallback triggered)");
        } else if (data1.length === 0) {
            console.log("PASS: Returned 0 properties");
        } else {
            console.log("Result:", data1);
        }

        // Case 2: Empty string
        console.log("\nTest 2: ?ids=");
        const req2 = mockReq({ ids: '' });
        const res2 = mockRes();
        await getProperties(req2, res2);

        const data2 = res2.data.data || res2.data;
        console.log(`Result count: ${data2.length}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testEmptyIds();
