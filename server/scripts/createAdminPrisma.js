const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            console.error('❌ Skipping admin creation: ADMIN_EMAIL or ADMIN_PASSWORD not set.');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                password_hash: hashedPassword,
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
