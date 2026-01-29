const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- ACTIVE OFFICE LISTINGS DEBUG ---');

        // 1. Check Counts
        const activeSahibinden = await prisma.property.count({
            where: {
                seller_type: 'office',
                status: 'active',
                url: { contains: 'sahibinden.com' }
            }
        });
        const activeHepsiemlak = await prisma.property.count({
            where: {
                seller_type: 'office',
                status: 'active',
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });

        console.log(`Active Sahibinden (Office): ${activeSahibinden}`);
        console.log(`Active Hepsiemlak (Office): ${activeHepsiemlak}`);

        // 2. Sample Seller Names to identify "Our" listings vs competitors
        // Group by seller_name
        const sellers = await prisma.property.groupBy({
            by: ['seller_name'],
            where: {
                seller_type: 'office',
                status: 'active'
            },
            _count: { id: true },
            orderBy: {
                _count: { id: 'desc' }
            },
            take: 20
        });

        console.log('\n--- TOP 20 SELLERS (Active Office) ---');
        sellers.forEach(s => {
            console.log(`${s.seller_name}: ${s._count.id}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
