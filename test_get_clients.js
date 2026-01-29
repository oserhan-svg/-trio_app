const clientController = require('./server/controllers/clientController');
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
    await clientController.getClients(req, res);
}

test().then(() => prisma.$disconnect());
