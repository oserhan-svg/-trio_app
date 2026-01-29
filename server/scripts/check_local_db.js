const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    const localUrl = process.env.LOCAL_DATABASE_URL;
    if (!localUrl) {
        console.error('LOCAL_DATABASE_URL not found in .env');
        return;
    }

    console.log('Connecting to Local DB:', localUrl);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: localUrl
            }
        }
    });

    try {
        const clientCount = await prisma.client.count();
        console.log('Local Client Count:', clientCount);

        if (clientCount > 0) {
            const clients = await prisma.client.findMany({
                take: 10
            });
            console.log('Local Clients (Preview):', JSON.stringify(clients, null, 2));
        }
    } catch (e) {
        console.error('Local DB access failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
