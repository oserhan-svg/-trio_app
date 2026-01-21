
const { getStats } = require('../controllers/analyticsController');
const { getProperties, getPropertyById } = require('../controllers/propertyController');
const prisma = require('../db');

// Mock Req/Res
const mockReq = (params = {}, query = {}) => ({ params, query, user: { id: 1 } });
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

async function testEndpoints() {
    console.log('--- Testing Endpoints ---');

    try {
        // 1. Test getStats
        console.log('Testing getStats...');
        const res1 = mockRes();
        await getStats(mockReq(), res1);
        if (res1.statusCode === 500) {
            console.error('getStats FAILED:', res1.data);
        } else {
            console.log('getStats OK');
        }

        // 2. Test getProperties
        console.log('Testing getProperties...');
        const res2 = mockRes();
        await getProperties(mockReq({}, { limit: 10 }), res2);
        if (res2.statusCode === 500) {
            console.error('getProperties FAILED:', res2.data);
        } else {
            console.log('getProperties OK');
        }

        // 3. Test getPropertyById (using a known ID)
        console.log('Testing getPropertyById...');
        const existingProp = await prisma.property.findFirst();
        if (existingProp) {
            const res3 = mockRes();
            await getPropertyById(mockReq({ id: existingProp.id }), res3);
            if (res3.statusCode === 500) {
                console.error('getPropertyById FAILED:', res3.data);
            } else {
                console.log(`getPropertyById (${existingProp.id}) OK`);
            }
        }

    } catch (e) {
        console.error('Test Crash:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testEndpoints();
