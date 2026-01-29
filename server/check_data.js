const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    console.log('--- Data Integrity Check ---');

    const statuses = await prisma.property.groupBy({
        by: ['status'],
        _count: { id: true }
    });
    console.log('Property Statuses:');
    console.table(statuses);

    const categories = await prisma.property.groupBy({
        by: ['category'],
        _count: { id: true }
    });
    console.log('Property Categories:');
    console.table(categories);

    const sample = await prisma.property.findMany({
        where: { status: 'active' },
        take: 3,
        select: { id: true, title: true, district: true, neighborhood: true }
    });
    console.log('Sample Active Items:', JSON.stringify(sample, null, 2));

    await prisma.$disconnect();
}

checkData().catch(console.error);
