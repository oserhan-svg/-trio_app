const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- PHONE NUMBER ANALYSIS ---');

        const phones = await prisma.property.groupBy({
            by: ['seller_phone'],
            where: {
                seller_type: 'office',
                status: 'active',
                url: { contains: 'sahibinden.com' }
            },
            _count: { id: true },
            orderBy: {
                _count: { id: 'desc' }
            },
            take: 20
        });

        phones.forEach(p => {
            console.log(`Phone: ${p.seller_phone} - Count: ${p._count.id}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
