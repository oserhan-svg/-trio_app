const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSources() {
    console.log('--- Listing Counts by Provider ---');

    const hepsiemlak = await prisma.property.count({
        where: {
            url: { contains: 'hepsiemlak' },
            status: 'active'
        }
    });

    const sahibinden = await prisma.property.count({
        where: {
            url: { contains: 'sahibinden' },
            status: 'active'
        }
    });

    const emlakjet = await prisma.property.count({
        where: {
            url: { contains: 'emlakjet' },
            status: 'active'
        }
    });

    console.log(`🏠 Hepsiemlak: ${hepsiemlak}`);
    console.log(`🟡 Sahibinden: ${sahibinden}`);
    console.log(`🟣 Emlakjet:   ${emlakjet}`);

    const sample = await prisma.property.findFirst({
        where: { url: { contains: 'hepsiemlak' }, status: 'active' },
        select: { id: true, title: true, listing_date: true }
    });

    if (sample) {
        console.log('\nSample Hepsiemlak Listing:', sample);
    } else {
        console.log('\n❌ No Active Hepsiemlak listings found!');
    }
}

checkSources()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
