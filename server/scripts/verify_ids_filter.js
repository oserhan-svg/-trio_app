
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

async function checkIdsFilter() {
    console.log('--- Checking IDs Filter Logic ---');
    try {
        // 1. Get a few random IDs
        const randomProps = await prisma.property.findMany({ take: 3, select: { id: true } });
        if (randomProps.length === 0) {
            console.log('No properties in DB');
            return;
        }

        const ids = randomProps.map(p => p.id);
        const idsStr = ids.join(',');
        console.log(`Testing with IDs: ${idsStr}`);

        // 2. Call getProperties with ids param
        const req = mockReq({ ids: idsStr });
        const res = mockRes();

        await getProperties(req, res);

        const data = res.data.data ? res.data.data : res.data;
        // Note: res.data might be the whole object or just data property depending on implementation (jsonBigInt usually sends string or obj)
        // If it's string, parse it.
        let parsed = typeof data === 'string' ? JSON.parse(data) : data;

        // Handling the structure returned by responseHelper
        const listings = parsed.data || parsed;

        if (!Array.isArray(listings)) {
            console.error('Response is not an array:', listings);
            return;
        }

        console.log(`Returned ${listings.length} properties.`);
        const returnedIds = listings.map(p => p.id).sort();
        const requestedIds = ids.sort();

        const match = JSON.stringify(returnedIds) === JSON.stringify(requestedIds);
        if (match) {
            console.log('✅ Success: Returned IDs match requested IDs.');
        } else {
            console.error('❌ Failure: IDs do not match.');
            console.log('Requested:', requestedIds);
            console.log('Returned:', returnedIds);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkIdsFilter();
