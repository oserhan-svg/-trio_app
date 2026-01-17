const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'danisman2@test.com';
    const password = '123';
    const role = 'consultant';

    const conflict = await prisma.user.findUnique({
        where: { email }
    });

    if (conflict) {
        console.log(`User ${email} already exists.`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password_hash: hashedPassword,
            role
        }
    });

    console.log(`User created: ${user.email} with role ${user.role}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
