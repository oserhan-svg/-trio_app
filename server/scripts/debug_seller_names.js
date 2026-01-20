const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBadSellerNames() {
    try {
        const properties = await prisma.property.findMany({
            where: {
                OR: [
                    { seller_name: { contains: '#' } },
                    { seller_name: { contains: 'Satılık' } },
                    { seller_name: { contains: 'Kiralık' } }
                ]
            },
            take: 20,
            select: { id: true, title: true, seller_name: true, external_id: true }
        });

        console.log(`Found ${properties.length} potential candidates.`);
        properties.forEach(p => {
            console.log(`ID: ${p.id} | Seller: ${p.seller_name} | Title: ${p.title.substring(0, 20)}...`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBadSellerNames();
