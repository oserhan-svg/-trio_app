const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const allClients = await prisma.client.findMany({
            include: { consultant: true }
        });

        console.log('Total Clients Found:', allClients.length);
        console.log('\nClients:');
        console.log(JSON.stringify(allClients, null, 2));

        const softDeleted = allClients.filter(c => c.deleted_at !== null);
        console.log('\nSoft Deleted Clients:', softDeleted.length);
        if (softDeleted.length > 0) {
            console.log(JSON.stringify(softDeleted, null, 2));
        }

    } catch (e) {
        console.error('Diagnostic failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
