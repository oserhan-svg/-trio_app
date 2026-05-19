const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = process.env.ADMIN_EMAIL || 'admin@emlak22.com';
        const password = process.env.ADMIN_PASSWORD || '1234';
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
