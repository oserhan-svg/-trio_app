const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Searching for "Trio"...');
        const matches = await prisma.property.findMany({
            where: {
                seller_type: 'office',
                OR: [
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { url: { contains: 'trio', mode: 'insensitive' } }
                ]
            },
            select: { id: true, seller_name: true, url: true }
        });

        console.log(`Found ${matches.length} matches.`);
        if (matches.length > 0) {
            console.log('Sample:', matches.slice(0, 5));
        }

        // Also check exact count of listings with NO seller name
        const nullSellerCount = await prisma.property.count({
            where: { seller_type: 'office', seller_name: null }
        });
        console.log(`Listings with NULL seller_name: ${nullSellerCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
