const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const nullCount = await prisma.property.count({ where: { seller_type: null } });
        const ownerCount = await prisma.property.count({ where: { seller_type: 'owner' } });
        const officeCount = await prisma.property.count({ where: { seller_type: 'office' } }); // literal 'office'
        const otherCount = await prisma.property.count({
            where: {
                AND: [
                    { seller_type: { not: 'owner' } },
                    { seller_type: { not: 'office' } },
                    { seller_type: { not: null } }
                ]
            }
        });

        console.log('--- Seller Type Distribution ---');
        console.log(`NULL: ${nullCount}`);
        console.log(`Owner: ${ownerCount}`);
        console.log(`Office: ${officeCount}`);
        console.log(`Other: ${otherCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
