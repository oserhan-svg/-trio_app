require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDescriptions() {
    try {
        const properties = await prisma.property.findMany({
            take: 20,
            where: { seller_name: { contains: 'Trio' } },
            select: { id: true, description: true }
        });

        properties.forEach(p => {
            console.log(`--- ID: ${p.id} ---`);
            console.log(p.description ? p.description.slice(0, 100) + '...' : 'NO DESC');
            // Check for names
            ['Ozancan', 'Raif', 'Kanat', 'Arzu'].forEach(name => {
                if (p.description && p.description.includes(name)) {
                    console.log(`MATCH FOUND IN DESC: ${name}`);
                }
            });
        });

    } catch (e) {
        console.log(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDescriptions();
