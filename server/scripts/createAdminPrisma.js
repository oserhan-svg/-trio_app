const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = 'admin@emlak22.com';
        const password = process.env.ADMIN_PASSWORD || '1234_SET_ME_IN_ENV';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                role: 'admin'
            },
            create: {
                email: email,
                password_hash: hashedPassword,
                role: 'admin'
            }
        });

        console.log('Admin user created/updated:', user.email);
    } catch (e) {
        console.error('Admin Creation Error:', e.message);
    }
}

module.exports = createAdmin;
