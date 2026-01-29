const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`);
        });

        const officeProperties = await prisma.property.count({
            where: { seller_type: 'office' }
        });
        console.log('\nTotal Office Properties:', officeProperties);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
