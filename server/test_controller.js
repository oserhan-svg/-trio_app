const clientController = require('./controllers/clientController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const req = {
        user: { role: 'admin', id: 1 },
        query: { page: 1, limit: 15 }
    };
    const res = {
        setHeader: () => { },
        status: (code) => {
            console.log('Status:', code);
            return {
                send: (data) => console.log('Data (string):', data.substring(0, 500) + '...'),
                json: (data) => console.log('JSON Data:', JSON.stringify(data).substring(0, 500) + '...')
            };
        }
    };

    console.log('Testing getClients as admin...');
    try {
        await clientController.getClients(req, res);
    } catch (e) {
        console.error('CONTROLLER ERROR:', e);
    }
}

test().then(() => prisma.$disconnect());
