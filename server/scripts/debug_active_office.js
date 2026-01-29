const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const activeCount = await prisma.property.count({ where: { status: 'active' } });
        const officeCount = await prisma.property.count({ where: { seller_type: 'office' } });

        const activeOfficeCount = await prisma.property.count({
            where: {
                status: 'active',
                seller_type: 'office'
            }
        });

        const activeOfficePrimaryCount = await prisma.property.count({
            where: {
                status: 'active',
                seller_type: 'office',
                is_primary: true
            }
        });

        console.log('--- ACTIVE OFFICE DEBUG ---');
        console.log('Active Total:', activeCount);
        console.log('Office Total:', officeCount);
        console.log('Active + Office:', activeOfficeCount);
        console.log('Active + Office + Primary:', activeOfficePrimaryCount);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
