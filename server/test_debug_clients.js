require('dotenv').config();
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
        status: function (code) {
            console.log('Response Status:', code);
            return this;
        },
        send: (data) => console.log('Response Data:', typeof data === 'string' ? data.substring(0, 100) : data),
        json: (data) => console.log('Response JSON (keys):', Object.keys(data))
    };

    console.log('Testing getClients start...');
    const start = Date.now();
    try {
        await clientController.getClients(req, res);
        console.log('Testing getClients end. Time:', Date.now() - start, 'ms');
    } catch (e) {
        console.error('Test crashed:', e);
    }
}

test().then(async () => {
    await prisma.$disconnect();
}).catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
