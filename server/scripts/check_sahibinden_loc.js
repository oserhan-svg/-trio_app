const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocations() {
    try {
        const props = await prisma.property.findMany({
            where: {
                url: { contains: 'sahibinden' },
                status: 'active'
            },
            select: {
                id: true,
                district: true,
                neighborhood: true,
                location: true,
                url: true
            },
            take: 5
        });
        console.log(JSON.stringify(props, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkLocations();
