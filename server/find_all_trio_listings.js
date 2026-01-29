const prisma = require('./db');

async function checkTrio() {
    try {
        const trioListings = await prisma.property.findMany({
            where: {
                OR: [
                    { url: { contains: 'trioemlakvegayrimenkul' } },
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                title: true,
                assigned_user_id: true,
                url: true,
                seller_name: true
            }
        });

        console.log(`Found ${trioListings.length} Trio-related listings.`);

        trioListings.forEach(p => {
            console.log(`[${p.id}] Assigned: ${p.assigned_user_id} | Seller: ${p.seller_name} | Title: "${p.title}" | URL: ${p.url.substring(0, 50)}...`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkTrio();
