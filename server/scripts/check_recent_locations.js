const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentLocations() {
    console.log('--- Checking Recent Sahibinden Locations (Last 10) ---');

    const listings = await prisma.property.findMany({
        where: {
            url: { contains: 'sahibinden' },
            status: 'active'
        },
        orderBy: { last_scraped: 'desc' }, // Check recently scraped ones
        take: 10,
        select: {
            id: true,
            title: true,
            district: true,
            neighborhood: true,
            last_scraped: true
        }
    });

    listings.forEach(l => {
        console.log(`[${l.id}] Scraped: ${l.last_scraped?.toISOString()}`);
        console.log(`   Dist: '${l.district}' | Neigh: '${l.neighborhood}'`);
    });
}

checkRecentLocations()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
