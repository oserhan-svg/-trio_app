const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkRemaining() {
    const count = await prisma.property.count({
        where: {
            OR: [
                { seller_name: { contains: '#' } },
                { seller_name: { contains: 'Satılık' } }
            ]
        }
    });
    console.log(`Remaining bad seller names: ${count}`);
}
checkRemaining().finally(() => prisma.$disconnect());
