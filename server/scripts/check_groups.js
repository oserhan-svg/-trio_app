const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const total = await prisma.property.count({ where: { seller_type: 'office' } });
        const grouped = await prisma.property.count({
            where: {
                seller_type: 'office',
                group_id: { not: null }
            }
        });

        console.log('--- GROUP ID DEBUG ---');
        console.log('Total Office Properties:', total);
        console.log('Grouped Properties:', grouped);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
