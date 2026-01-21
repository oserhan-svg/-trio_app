const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullCycle() {
    const email = `test_del_${Date.now()}@example.com`;
    const password_hash = 'hash';
    const role = 'consultant';

    try {
        // 1. Create User
        console.log('Creating user...');
        const user = await prisma.user.create({
            data: { email, password_hash, role }
        });
        const userId = user.id;
        console.log(`User created: ${userId}`);

        // 2. Create Dependencies
        console.log('Creating dependencies...');

        // Client
        await prisma.client.create({
            data: {
                name: 'Test Client',
                consultant_id: userId,
                type: 'buyer',
                status: 'New'
            }
        });

        // Pending Contact
        await prisma.pendingContact.create({
            data: {
                name: 'Test Pending',
                consultant_id: userId
            }
        });

        // Agenda Item
        await prisma.agendaItem.create({
            data: {
                title: 'Test Meeting',
                start_at: new Date(),
                type: 'meeting',
                user_id: userId
            }
        });

        // Property Assignment (Need an existing property or create one)
        // We will create a dummy property
        await prisma.property.create({
            data: {
                title: 'Test Prop',
                price: 100000,
                url: 'http://test.com/' + Date.now(),
                listing_type: 'sale',
                category: 'residential',
                assigned_user_id: userId
            }
        });

        console.log('Dependencies created.');

        // 3. Delete User using Transaction (simulating controller)
        console.log('Attempting deletion...');
        await prisma.$transaction(async (tx) => {
            const deletedAgenda = await tx.agendaItem.deleteMany({ where: { user_id: userId } });
            console.log(`Deleted ${deletedAgenda.count} agenda items.`);

            const deletedPending = await tx.pendingContact.deleteMany({ where: { consultant_id: userId } });
            console.log(`Deleted ${deletedPending.count} pending contacts.`);

            const updatedProps = await tx.property.updateMany({
                where: { assigned_user_id: userId },
                data: { assigned_user_id: null }
            });
            console.log(`Unassigned ${updatedProps.count} properties.`);

            const updatedClients = await tx.client.updateMany({
                where: { consultant_id: userId },
                data: { consultant_id: null }
            });
            console.log(`Unassigned ${updatedClients.count} clients.`);

            await tx.user.delete({
                where: { id: userId }
            });
        });

        console.log('User deleted successfully (Logic is valid).');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFullCycle();
