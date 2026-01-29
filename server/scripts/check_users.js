const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users in DB:');
        console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
