const { getProperties } = require('../controllers/propertyController');
const prisma = require('../db');

const mockReq = (query = {}) => ({ query, user: { id: 1 } });
const mockRes = () => {
    const res = {};
    res.headers = {};
    res.statusCode = 200;
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    res.send = (data) => { res.data = data; return res; };
    res.setHeader = (key, val) => { res.headers[key] = val; return res; };
    return res;
};

async function debugOpportunities() {
    console.log('--- Debugging Opportunities ---');
    try {
        // 1. Check database for active primary properties
        const counts = await prisma.property.count({
            where: { status: 'active', is_primary: true }
        });
        console.log(`Active Primary Properties Count: ${counts}`);

        // 2. Test getProperties (Opportunity Filter)
        console.log('\n--- Testing "Fırsatlar" Path ---');
        const reqOpp = mockReq({ opportunity_filter: 'opportunity', limit: '100' });
        const resOpp = mockRes();
        await getProperties(reqOpp, resOpp);

        if (resOpp.statusCode !== 200) {
            console.error('Fırsatlar API Failed:', resOpp.statusCode, resOpp.data);
        } else {
            let parsedOpp = (typeof resOpp.data === 'string') ? JSON.parse(resOpp.data) : resOpp.data;
            console.log(`Fırsatlar Total: ${parsedOpp?.meta?.total || 0}`);
            console.log(`Fırsatlar Data Array Length: ${parsedOpp?.data?.length || 0}`);
        }

        // 3. Test getProperties (All Path)
        console.log('\n--- Testing "Tümü" Path ---');
        const reqAll = mockReq({ limit: '100' });
        const resAll = mockRes();
        await getProperties(reqAll, resAll);

        if (resAll.statusCode !== 200) {
            console.error('Tümü API Failed:', resAll.statusCode, resAll.data);
        } else {
            let parsedAll = (typeof resAll.data === 'string') ? JSON.parse(resAll.data) : resAll.data;
            console.log(`Tümü Total: ${parsedAll?.meta?.total || 0}`);
            console.log(`Tümü Data Array Length: ${parsedAll?.data?.length || 0}`);
            if (parsedAll?.data?.length > 0) {
                console.log(`First item title: ${parsedAll.data[0].title}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugOpportunities();
