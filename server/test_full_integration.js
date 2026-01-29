require('dotenv').config();
const clientController = require('./controllers/clientController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullIntegration() {
    console.log('--- Full Integration Test for getClients ---');

    // Mock Request object
    const req = {
        user: { id: 1, role: 'admin' }, // Assuming user ID 1 is an admin
        query: { page: 1, limit: 15 }
    };

    // Mock Response object
    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            console.log('Status Code:', this.statusCode || 200);
            if (this.statusCode && this.statusCode >= 400) {
                console.error('Error Response:', JSON.stringify(data, null, 2));
            } else {
                console.log('Success Response:', {
                    dataCount: data.data?.length,
                    total: data.total,
                    stats: data.stats
                });
            }
        },
        setHeader: function () { }
    };

    try {
        await clientController.getClients(req, res);
    } catch (error) {
        console.error('Controller Crashed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFullIntegration();
