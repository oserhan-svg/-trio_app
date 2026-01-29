require('dotenv').config();
const prisma = require('./db');

async function updateKubat() {
    try {
        console.log('Updating user 68 name to "Kubat Kanat"...');
        const user = await prisma.user.update({
            where: { id: 68 },
            data: { name: 'Kubat Kanat' }
        });
        console.log('Updated user:', user);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateKubat();
