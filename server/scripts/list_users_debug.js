
const prisma = require('../db');

async function listUsers() {
    try {
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Users:', users);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
