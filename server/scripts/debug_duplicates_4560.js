
const prisma = require('../db');

async function debugDuplicates() {
    const propertyId = 4560;
    try {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) {
            console.log('Property 4560 not found');
            return;
        }

        console.log(`Property ${propertyId} Group ID: ${property.group_id}`);
        console.log(`Property URL: ${property.url}`);

        if (property.group_id) {
            const otherListings = await prisma.property.findMany({
                where: {
                    group_id: property.group_id,
                    id: { not: propertyId }
                },
                select: {
                    id: true,
                    url: true,
                    title: true,
                    price: true
                }
            });

            console.log(`Found ${otherListings.length} other listings in group.`);
            otherListings.forEach(l => {
                console.log(`[${l.id}] ${l.url} (${l.price})`);
                // Simulate normalization
                const cleanUrl = l.url ? l.url.split('?')[0]
                    .replace(/^https?:\/\/(www\.)?/, '')
                    .replace(/\/$/, '')
                    .toLowerCase() : 'NO_URL';
                console.log(`   Normalized: ${cleanUrl}`);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugDuplicates();
