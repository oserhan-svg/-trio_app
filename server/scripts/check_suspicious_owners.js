const prisma = require('../db');

async function checkSuspiciousOwners() {
    try {
        console.log("Checking for 'owner' listings with office-like keywords...");

        const suspicious = await prisma.property.findMany({
            where: {
                seller_type: 'owner',
                OR: [
                    { title: { contains: 'Emlak', mode: 'insensitive' } },
                    { title: { contains: 'Gayrimenkul', mode: 'insensitive' } },
                    { title: { contains: 'Office', mode: 'insensitive' } },
                    { title: { contains: 'Danışmanlık', mode: 'insensitive' } },
                    { seller_name: { contains: 'Emlak', mode: 'insensitive' } }
                ]
            },
            select: { id: true, title: true, seller_name: true, seller_type: true }
        });

        console.log(`Found ${suspicious.length} suspicious listings.`);
        suspicious.forEach(p => {
            console.log(`[${p.id}] ${p.title} (Seller: ${p.seller_name})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuspiciousOwners();
