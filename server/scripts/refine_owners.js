const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fixOwners() {
    const res = await prisma.property.updateMany({
        where: { seller_type: 'owner', seller_name: 'Bilinmiyor' },
        data: { seller_name: 'Sahibinden' }
    });
    console.log(`Fixed ${res.count} owner listings.`);
}
fixOwners().finally(() => prisma.$disconnect());
