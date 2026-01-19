const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function updatePassword() {
    console.log('🔐 Updating admin password...');
    try {
        const hashedPassword = await bcrypt.hash('1234', 10);
        await prisma.user.update({
            where: { email: 'admin@emlak22.com' },
            data: { password_hash: hashedPassword }
        });
        console.log('✅ Admin password updated to: 1234');
    } catch (error) {
        console.error('❌ Failed to update password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

updatePassword();
