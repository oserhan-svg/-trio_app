const prisma = require('./db');
const { getProperties } = require('./controllers/propertyController');

async function test() {
    const mockReq = {
        query: {
            assigned_user_id: '1', // Assuming ID 1 exists
            limit: '10'
        }
    };
    const mockRes = {
        status: (code) => {
            console.log('Status:', code);
            return mockRes;
        },
        json: (data) => {
            console.log('Response:', JSON.stringify(data, null, 2).slice(0, 500));
        }
    };

    try {
        await getProperties(mockReq, mockRes);
    } catch (error) {
        console.error('TRAPPED ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
