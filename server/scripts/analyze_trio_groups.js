const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Find Trio Listings (mostly Hepsiemlak)
        const trioListings = await prisma.property.findMany({
            where: {
                seller_type: 'office',
                OR: [
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { url: { contains: 'trio', mode: 'insensitive' } }
                ]
            },
            select: { id: true, group_id: true, url: true }
        });

        console.log(`Found ${trioListings.length} Trio source listings.`);

        const groupIds = trioListings
            .map(t => t.group_id)
            .filter(g => g !== null);

        console.log(`Associated with ${new Set(groupIds).size} unique groups.`);

        if (groupIds.length === 0) {
            console.log('No groups found for Trio listings.');
            return;
        }

        // 2. Find ALL listings in those groups (hopefully identifying Sahibinden ones)
        const portfolio = await prisma.property.findMany({
            where: {
                group_id: { in: groupIds }
            },
            select: { id: true, url: true, seller_name: true, seller_type: true }
        });

        console.log(`Total Extended Portfolio: ${portfolio.length}`);

        const sahibindenMatches = portfolio.filter(p => p.url.includes('sahibinden.com'));
        console.log(`Indirectly Found Sahibinden Listings: ${sahibindenMatches.length}`);

        if (sahibindenMatches.length > 0) {
            console.log('Sample Sahibinden URLs:', sahibindenMatches.slice(0, 3).map(p => p.url));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
