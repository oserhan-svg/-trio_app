const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const clientCount = await prisma.client.count();
        const userCount = await prisma.user.count();
        const propertyCount = await prisma.property.count();
        const auditCount = await prisma.auditLog.count();
        const pendingCount = await prisma.pendingContact.count();

        console.log('Record Counts:', {
            clients: clientCount,
            users: userCount,
            properties: propertyCount,
            auditLogs: auditCount,
            pendingContacts: pendingCount
        });

        if (auditCount > 0) {
            console.log('\nLast 5 Audit Logs:');
            const recentLogs = await prisma.auditLog.findMany({
                orderBy: { created_at: 'desc' },
                take: 5
            });
            console.log(JSON.stringify(recentLogs, null, 2));
        }

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
