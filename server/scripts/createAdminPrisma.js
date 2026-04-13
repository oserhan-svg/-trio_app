const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = 'admin@emlak22.com';
        const password = '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
            return;
        }

        const user = await prisma.user.create({
            data: {
                email: email,
                password_hash: hashedPassword,
                role: 'admin'
            }
        });

        console.log('Admin user created:', user.email);
    } catch (e) {
        console.error('Admin Creation Error:', e.message);
    }
}

module.exports = createAdmin;
