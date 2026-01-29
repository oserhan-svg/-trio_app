const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        const email = 'kubatkanat@gmail.com';
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'admin' }
        });
        console.log(`✅ Updated user ${email} to role: ${user.role}`);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
