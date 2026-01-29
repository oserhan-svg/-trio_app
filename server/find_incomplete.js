const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findIncomplete() {
    try {
        const properties = await prisma.property.findMany({
            where: {
                OR: [
                    { seller_phone: null },
                    { seller_phone: '' },
                    { description: null },
                    { description: '' },
                    { images: { equals: [] } }
                ],
                status: 'active',
                url: { contains: 'sahibinden.com' }
            },
            select: {
                id: true,
                url: true
            },
            take: 50
        });

        console.log(`Found ${properties.length} incomplete listings.`);
        console.log(JSON.stringify(properties, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findIncomplete();
