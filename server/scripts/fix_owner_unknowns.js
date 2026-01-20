const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fixOwnerNames() {
    const result = await prisma.property.updateMany({
        where: {
            AND: [
                { seller_name: 'Bilinmiyor' },
                {
                    OR: [
                        { seller_type: 'owner' },
                        { url: { contains: 'sahibinden-satilik' } },
                        { url: { contains: 'kiralik-sahibinden' } }
                    ]
                }
            ]
        },
        data: { seller_name: 'Sahibinden', seller_type: 'owner' }
    });
    console.log(`Updated ${result.count} listings to 'Sahibinden'.`);
}
fixOwnerNames().finally(() => prisma.$disconnect());
