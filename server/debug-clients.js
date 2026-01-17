const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const clients = await prisma.client.findMany();
        console.log('Total Clients:', clients.length);
        console.log('Clients:', JSON.stringify(clients, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
