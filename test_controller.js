const prisma = require('./server/db');
const propertyController = require('./server/controllers/propertyController');

async function testController() {
    try {
        console.log('--- Controller Mock Test ---');

        const req = {
            query: { portfolio: 'agency', status: 'active' },
            user: { id: 1, role: 'admin' }
        };

        const res = {
            status: function (code) { this.statusCode = code; return this; },
            setHeader: function () { },
            json: function (data) { console.log('Response JSON:', JSON.stringify(data, null, 2)); },
            send: function (data) { console.log('Response Send (String):', data); }
        };

        console.log('\n--- Testing getPortfolioStats ---');
        await propertyController.getPortfolioStats(req, res);

        console.log('\n--- Testing getProperties ---');
        await propertyController.getProperties(req, res);

    } catch (error) {
        console.error('--- CRITICAL TEST FAILURE ---');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testController();
