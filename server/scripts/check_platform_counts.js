const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const sahibindenCount = await prisma.property.count({
            where: {
                seller_type: 'office',
                url: { contains: 'sahibinden.com' }
            }
        });

        const hepsiemlakCount = await prisma.property.count({
            where: {
                seller_type: 'office',
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });

        console.log('--- PLATFORM COUNTS ---');
        console.log('Sahibinden:', sahibindenCount);
        console.log('Hepsiemlak:', hepsiemlakCount);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
