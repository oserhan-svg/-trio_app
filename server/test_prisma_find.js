const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

async function testFindMany() {
    try {
        console.log('Testing findMany with include demands...');
        const clients = await prisma.client.findMany({
            take: 1,
            include: { demands: true }
        });
        console.log('Success! Found', clients.length, 'clients.');
        if (clients.length > 0) {
            console.log('First client demands count:', clients[0].demands.length);
        }
    } catch (err) {
        console.error('findMany FAILED:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testFindMany();
