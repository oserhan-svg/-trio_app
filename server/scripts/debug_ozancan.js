const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOzancan() {
    try {
        console.log('--- Debugging Ozancan Listings ---');

        // 1. Search for listings where he is assigned
        const assigned = await prisma.property.findMany({
            where: { assigned_user_id: 76 }
        });
        console.log(`Assigned to ID 76: ${assigned.length}`);

        // 2. Search by seller_name
        const bySellerName = await prisma.property.findMany({
            where: { seller_name: { contains: 'Ozancan', mode: 'insensitive' } }
        });
        console.log(`Mentioned in seller_name: ${bySellerName.length}`);
        bySellerName.forEach(p => {
            console.log(` - ID: ${p.id}, Status: ${p.status}, Assigned: ${p.assigned_user_id}, URL: ${p.url}`);
        });

        // 3. Search by title/description
        const byText = await prisma.property.findMany({
            where: {
                OR: [
                    { title: { contains: 'Ozancan', mode: 'insensitive' } },
                    { description: { contains: 'Ozancan', mode: 'insensitive' } }
                ]
            },
            take: 10
        });
        console.log(`Mentioned in text (first 10): ${byText.length}`);

        // 4. Client Properties (Just in case)
        const clientProps = await prisma.clientProperty.count({
            where: { client: { consultant_id: 76 } }
        });
        console.log(`Client Properties for Consultant 76: ${clientProps}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugOzancan();
