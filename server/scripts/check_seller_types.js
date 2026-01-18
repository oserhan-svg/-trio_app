const prisma = require('../db');

async function checkSellerTypes() {
    try {
        const stats = await prisma.property.groupBy({
            by: ['seller_type'],
            _count: { id: true }
        });
        console.log('Seller Type Distribution:', stats);

        // Sample check for 'owner' listings
        const owners = await prisma.property.findMany({
            where: { seller_type: 'owner' },
            take: 5,
            select: { id: true, title: true, seller_name: true }
        });
        console.log('\nSample Owner Listings:', owners);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSellerTypes();
