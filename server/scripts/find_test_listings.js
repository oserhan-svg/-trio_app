const prisma = require('../db');

async function findTestListings() {
    try {
        console.log("Searching for test listings...");

        const testListings = await prisma.property.findMany({
            where: {
                OR: [
                    { title: { contains: 'test', mode: 'insensitive' } },
                    { title: { contains: 'deneme', mode: 'insensitive' } },
                    { description: { contains: 'test', mode: 'insensitive' } },
                    { seller_name: { contains: 'test', mode: 'insensitive' } }
                ]
            },
            select: { id: true, title: true, price: true, seller_name: true }
        });

        console.log(`Found ${testListings.length} potential test listings.`);
        testListings.forEach(p => {
            console.log(`[DELETE CANDIDATE] ID: ${p.id}, Title: ${p.title} (${p.price} TL)`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findTestListings();
