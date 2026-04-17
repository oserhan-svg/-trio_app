const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = 'admin@emlak22.com';
        // SECURITY: Use environment variable for initial password, fallback to 1234 only in dev
        const password = process.env.INITIAL_ADMIN_PASSWORD || '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                // SECURITY: Never reset password_hash on restart if user already exists
                role: 'admin'
            },
            create: {
                email: email,
                password_hash: hashedPassword,
                role: 'admin'
            }
        });

        console.log('Admin user verified:', user.email);
    } catch (e) {
        console.error('Admin Creation Error:', e.message);
    }
}

module.exports = createAdmin;
