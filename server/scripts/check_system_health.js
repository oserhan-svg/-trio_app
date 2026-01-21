const prisma = require('../db');

async function check() {
    console.log('--- SYSTEM HEALTH CHECK ---');
    try {
        const users = await prisma.user.count();
        const properties = await prisma.property.count();
        const clients = await prisma.client.count();
        const pending = await prisma.pendingContact.count();

        console.log(`Users: ${users}`);
        console.log(`Properties: ${properties}`);
        console.log(`Clients: ${clients}`);
        console.log(`Pending Contacts: ${pending}`);

        if (users > 0) {
            const firstUser = await prisma.user.findFirst();
            console.log('First User ID:', firstUser.id, 'Role:', firstUser.role);
        }

    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
