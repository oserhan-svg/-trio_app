const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocations() {
    console.log('--- Checking Sahibinden Locations ---');

    const listings = await prisma.property.findMany({
        where: {
            url: { contains: 'sahibinden' },
            status: 'active'
        },
        select: {
            id: true,
            title: true,
            district: true,
            neighborhood: true,
            // location: true, // Removed invalid field
            url: true
        },
        take: 10,
        orderBy: { created_at: 'desc' }
    });

    if (listings.length === 0) {
        console.log('No active Sahibinden listings found!');
        return;
    }

    listings.forEach((l, i) => {
        console.log(`\n[${i + 1}] ID: ${l.id}`);
        console.log(`    Title: ${l.title}`);
        console.log(`    District: '${l.district}'`);
        console.log(`    Neighborhood: '${l.neighborhood}'`);
        // console.log(`    Location (Raw): '${l.location}'`); // Assuming this might exist or checks generic field
    });
}

checkLocations()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
