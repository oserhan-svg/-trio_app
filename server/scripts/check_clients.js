const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.client.count();
        console.log(`Total Clients in DB: ${count}`);
        if (count > 0) {
            const clients = await prisma.client.findMany({ take: 5 });
            console.log('Sample Clients:', clients);
        }
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
