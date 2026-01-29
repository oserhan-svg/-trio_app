const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrimaryStatus() {
    console.log('--- Primary Status Check ---');

    const stats = await prisma.property.groupBy({
        by: ['is_primary', 'status'],
        _count: { id: true }
    });

    console.table(stats);

    const secondaryActive = await prisma.property.findMany({
        where: { status: 'active', is_primary: false },
        take: 5,
        select: { id: true, title: true, group_id: true, url: true }
    });

    console.log('Sample Secondary Active Listings:');
    console.table(secondaryActive);

    await prisma.$disconnect();
}

checkPrimaryStatus().catch(console.error);
