const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const hepsiemlakTotal = await prisma.property.count({
            where: { url: { contains: 'hepsiemlak', mode: 'insensitive' } }
        });

        const sahibindenTotal = await prisma.property.count({
            where: { url: { contains: 'sahibinden', mode: 'insensitive' } }
        });

        const hepsiemlakOffice = await prisma.property.count({
            where: {
                url: { contains: 'hepsiemlak', mode: 'insensitive' },
                seller_type: 'office'
            }
        });

        const hepsiemlakOwner = await prisma.property.count({
            where: {
                url: { contains: 'hepsiemlak', mode: 'insensitive' },
                seller_type: 'owner'
            }
        });

        console.log('--- Portal Distribution ---');
        console.log(`Sahibinden Total: ${sahibindenTotal}`);
        console.log(`Hepsiemlak Total: ${hepsiemlakTotal}`);
        console.log(`  > Office: ${hepsiemlakOffice}`);
        console.log(`  > Owner: ${hepsiemlakOwner}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
