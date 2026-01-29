const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetchClients() {
    try {
        console.log('Testing as Admin...');
        const adminUser = { id: 1, role: 'admin' }; // Example admin
        const adminClients = await prisma.client.findMany({
            where: {},
            include: { demands: true, consultant: { select: { email: true } } },
            orderBy: { created_at: 'desc' }
        });
        console.log('Admin Fetch Success:', adminClients.length, 'clients found.');

        console.log('\nTesting as Consultant (ID 1)...');
        const consultantUser = { id: 1, role: 'consultant' };
        let where = {
            OR: [
                { consultant_id: consultantUser.id },
                { consultant_id: null }
            ]
        };
        const consultantClients = await prisma.client.findMany({
            where,
            include: { demands: true, consultant: { select: { email: true } } },
            orderBy: { created_at: 'desc' }
        });
        console.log('Consultant Fetch Success:', consultantClients.length, 'clients found.');

        console.log('\nTesting as Consultant (ID 1 as string)...');
        const consultantUserStr = { id: '1', role: 'consultant' };
        let whereStr = {
            OR: [
                { consultant_id: parseInt(consultantUserStr.id) },
                { consultant_id: null }
            ]
        };
        const consultantClientsStr = await prisma.client.findMany({
            where: {
                OR: [
                    { consultant_id: consultantUserStr.id }, // Testing if string causes error
                    { consultant_id: null }
                ]
            },
            include: { demands: true, consultant: { select: { email: true } } },
            orderBy: { created_at: 'desc' }
        });
        console.log('Consultant (String ID) Fetch Success:', consultantClientsStr.length, 'clients found.');

    } catch (error) {
        console.error('\n--- FETCH ERROR DETECTED ---');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Meta:', error.meta);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testFetchClients();
