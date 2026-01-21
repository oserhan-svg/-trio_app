
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

    // Stub for jsonBigInt responseHelper
    res.send = (data) => {
        res.data = data;
        return res;
    };

    res.setHeader = (key, val) => {
        res.headers[key] = val;
        return res;
    };

    return res;
};

async function testUserIssue() {
    console.log('--- Debugging User Issue ---');
    try {
        const idsString = '5172,5171,5088,5087';
        console.log(`Requesting IDs: ${idsString}`);

        const req = mockReq({ ids: idsString });
        const res = mockRes();

        await getProperties(req, res);

        const raw = res.data;
        // responseHelper might return { data: [...], meta: ... } or just string
        let result = raw;
        if (typeof raw === 'string') {
            try {
                result = JSON.parse(raw);
            } catch (e) {
                console.log('Failed to parse (BigInt?) response.');
            }
        }

        const list = result.data || result;

        if (Array.isArray(list)) {
            console.log(`Returned Count: ${list.length}`);
            const returnedIds = list.map(p => p.id).sort((a, b) => a - b);
            console.log(`Returned IDs: ${returnedIds.join(',')}`);

            if (list.length > 4) {
                console.error("FAIL: Too many items returned!");
            } else {
                console.log("PASS: Count is correct.");
            }
        } else {
            console.error("Result is not an array:", result);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testUserIssue();
