require('dotenv').config();
const prisma = require('./db');

async function fixNameCorrect() {
    try {
        console.log('Correcting user 68 name to "Kanat Kubat"...');
        const user = await prisma.user.update({
            where: { id: 68 },
            data: { name: 'Kanat Kubat' }
        });
        console.log('Updated user:', user);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixNameCorrect();
