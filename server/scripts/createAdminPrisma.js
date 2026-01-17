const prisma = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        const email = 'admin@emlak22.com';
        const password = 'admin123';
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

        console.log('Admin user created/updated:', user);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
