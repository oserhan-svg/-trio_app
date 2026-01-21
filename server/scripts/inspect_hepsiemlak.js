const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    console.log('--- Inspecting Hepsiemlak Listings ---');

    const listings = await prisma.property.findMany({
        where: {
            url: { contains: 'hepsiemlak' },
            status: 'active'
        },
        take: 5
    });

    if (listings.length === 0) {
        console.log('No active Hepsiemlak listings found!');
        return;
    }

    listings.forEach((l, i) => {
        console.log(`\n[${i + 1}] ID: ${l.id} | ${l.title}`);
        console.log(`    URL: ${l.url}`);
        console.log(`    Category: '${l.category}'`);
        console.log(`    Listing Type: '${l.listing_type}'`);
        console.log(`    Price: ${l.price}`);
        console.log(`    Rooms: '${l.rooms}'`);
        console.log(`    Status: '${l.status}'`);
        console.log(`    Is Primary: ${l.is_primary}`);
        console.log(`    Created At: ${l.created_at}`);
    });
}

inspect()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
