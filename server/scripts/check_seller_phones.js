require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhones() {
    try {
        const properties = await prisma.property.findMany({
            take: 20,
            where: { seller_name: { contains: 'Trio' } },
            select: { id: true, seller_name: true, seller_phone: true, url: true }
        });
        console.log(JSON.stringify(properties, null, 2));
    } catch (e) {
        console.log(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPhones();
