require('dotenv').config();
const prisma = require('./server/db');

async function checkKanatLive() {
    try {
        const user = await prisma.user.findUnique({ where: { id: 68 } });
        console.log('User 68:', user);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkKanatLive();
