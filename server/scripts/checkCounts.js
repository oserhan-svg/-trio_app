const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.property.count();
    const active = await prisma.property.count({ where: { status: 'active' } });
    const primaryActive = await prisma.property.count({ where: { status: 'active', is_primary: true } });
    const notPrimary = await prisma.property.count({ where: { is_primary: false } });
    const removed = await prisma.property.count({ where: { status: 'removed' } });

    console.log('Total properties:', total);
    console.log('Active properties:', active);
    console.log('Primary Active properties:', primaryActive);
    console.log('Not Primary properties:', notPrimary);
    console.log('Removed properties:', removed);

    // Group by status
    const statusCounts = await prisma.property.groupBy({
        by: ['status'],
        _count: true
    });
    console.log('Status counts:', statusCounts);

    // Group by is_primary
    const primaryCounts = await prisma.property.groupBy({
        by: ['is_primary'],
        _count: true
    });
    console.log('Primary counts:', primaryCounts);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
