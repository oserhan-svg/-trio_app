const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUrlStructure() {
    const hemlakCount = await prisma.property.count({
        where: { url: { contains: 'hemlak.com' }, status: 'active' }
    });

    const hepsiemlakCount = await prisma.property.count({
        where: { url: { contains: 'hepsiemlak.com' }, status: 'active' }
    });

    console.log(`URL contains 'hemlak.com':     ${hemlakCount}`);
    console.log(`URL contains 'hepsiemlak.com': ${hepsiemlakCount}`);
}

checkUrlStructure()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
