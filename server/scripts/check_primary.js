const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrimary() {
    console.log('--- Checking Primary Status ---');

    const hepsiTotal = await prisma.property.count({
        where: { url: { contains: 'hepsiemlak' }, status: 'active' }
    });

    const hepsiPrimary = await prisma.property.count({
        where: {
            url: { contains: 'hepsiemlak' },
            status: 'active',
            is_primary: true
        }
    });

    console.log(`🏠 Hepsiemlak Total (Active): ${hepsiTotal}`);
    console.log(`🏠 Hepsiemlak Primary:       ${hepsiPrimary}`);

    if (hepsiPrimary === 0) {
        console.log('⚠️ ALERT: No Hepsiemlak listings are marked as primary!');
    }

    const sahibindenPrimary = await prisma.property.count({
        where: {
            url: { contains: 'sahibinden' },
            status: 'active',
            is_primary: true
        }
    });
    console.log(`🟡 Sahibinden Primary:        ${sahibindenPrimary}`);
}

checkPrimary()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
