const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProperties() {
    try {
        const properties = await prisma.property.findMany({
            select: { id: true, title: true, url: true, seller_type: true, created_at: true }
        });

        console.log(`Total properties: ${properties.length}`);
        console.log('--- First 10 ---');
        properties.slice(0, 10).forEach(p => console.log(`${p.id}: ${p.title} (${p.url})`));
        console.log('--- Last 10 ---');
        properties.slice(-10).forEach(p => console.log(`${p.id}: ${p.title} (${p.url})`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProperties();
