const prisma = require('../db');

async function checkOwnerDrops() {
    try {
        // 1. Get all properties with recent price drops
        const recentDrops = await prisma.propertyHistory.findMany({
            where: {
                change_type: 'price_decrease',
                changed_at: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 30))
                }
            },
            include: {
                property: true
            }
        });

        console.log(`Total Recent Price Drops: ${recentDrops.length}`);

        const ownerDrops = recentDrops.filter(h => h.property.seller_type === 'owner');
        console.log(`Price Drops belonging to 'owner': ${ownerDrops.length}`);

        if (recentDrops.length > 0) {
            console.log('Details of existing price drops:');
            recentDrops.forEach(d => {
                console.log(`- ID: ${d.property.id}, Seller: ${d.property.seller_type}, Price: ${d.property.price}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkOwnerDrops();
