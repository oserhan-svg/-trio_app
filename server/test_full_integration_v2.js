require('dotenv').config();
const clientController = require('./controllers/clientController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullIntegration() {
    console.log('--- Corrected Full Integration Test for getClients ---');

    // Mock Request object
    const req = {
        user: { id: 1, role: 'admin' },
        query: { page: 1, limit: 15 }
    };

    // Mock Response object
    const res = {
        statusCode: 200,
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        send: function (data) {
            console.log('Status Code:', this.statusCode);
            if (this.statusCode >= 400) {
                console.error('Error Response (String):', data);
            } else {
                try {
                    const parsed = JSON.parse(data);
                    console.log('Success Response:', {
                        dataCount: parsed.data?.length,
                        total: parsed.total,
                        stats: parsed.stats
                    });
                } catch (e) {
                    console.log('Success Response (String):', data.substring(0, 100));
                }
            }
        },
        json: function (data) {
            console.log('Status Code:', this.statusCode);
            if (this.statusCode >= 400) {
                console.error('Error Response (JSON):', data);
            } else {
                console.log('Success Response (JSON):', {
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
