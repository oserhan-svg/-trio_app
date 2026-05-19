const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function updatePassword() {
    console.log('🔐 Updating admin password...');
    try {
        const email = process.env.ADMIN_EMAIL || 'admin@emlak22.com';
        const password = process.env.ADMIN_PASSWORD || '1234';
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email: email },
            data: { password_hash: hashedPassword }
        });
        console.log(`✅ Admin password updated for: ${email}`);
    } catch (error) {
        console.error('❌ Failed to update password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

updatePassword();
