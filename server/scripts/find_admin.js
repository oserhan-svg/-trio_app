const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        console.log('--- User List ---');
        const users = await prisma.user.findMany();
        console.table(users);

        const admin = users.find(u => u.role === 'admin' || u.email.includes('trio'));
        if (admin) {
            console.log(`\n✅ Likely Admin Found: ID=${admin.id}, Name=${admin.name}, Email=${admin.email}`);
        } else {
            console.log('\n❌ No obvious admin found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
