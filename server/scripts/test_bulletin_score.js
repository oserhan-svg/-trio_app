
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

async function testScore() {
    console.log('--- Testing Bulletin Score ---');
    try {
        // Find an owner property
        const ownerProp = await prisma.property.findFirst({
            where: { seller_type: 'owner' }
        });

        if (!ownerProp) {
            console.log('No owner property found to test.');
            return;
        }

        console.log(`Testing Property ID: ${ownerProp.id} (Seller: ${ownerProp.seller_type})`);

        const req = mockReq({ ids: String(ownerProp.id) });
        const res = mockRes();

        await getProperties(req, res);

        if (res.statusCode !== 200) {
            console.error('API Failed:', res.statusCode, res.data);
            return;
        }

        // Check response data
        const data = res.data; // might be string if jsonBigInt used res.send(string)

        let parsedData;
        if (typeof data === 'string') {
            parsedData = JSON.parse(data);
        } else {
            parsedData = data;
        }

        const props = parsedData.data || parsedData;
        if (Array.isArray(props) && props.length > 0) {
            const p = props[0];
            console.log(`ID: ${p.id}`);
            console.log(`Opportunity Score: ${p.opportunity_score}`);
            console.log(`Label: ${p.opportunity_label}`);
            console.log(`Seller Type: ${p.seller_type}`);
        } else {
            console.log('No properties returned in response.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testScore();
