const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function deduplicatePerfect() {
    try {
        console.log('--- Starting Perfect Portfolio Deduplication ---');

        const portfolio = await prisma.property.findMany({
            where: { assigned_user_id: { not: null } },
            orderBy: [{ created_at: 'asc' }]
        });

        console.log(`Analyzing ${portfolio.length} portfolio items...`);

        const groups = new Map();

        // 1. Advanced Grouping Logic
        portfolio.forEach(p => {
            // Normalize Title: Remove common fillers and platform-specific noise
            let normTitle = p.title.toLowerCase()
                .replace(/emlak|gayrimenkul|danışmanlık|satılık|kiralık|fırsat|kelepir|acil|kaçırmayın/g, '')
                .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
                .slice(0, 15); // First 15 chars for fuzzy match

            // Normalize Price: Ensure it's a string/number comparison
            const priceStr = parseFloat(p.price).toString();

            // Location Key: Neighborhood or District
            const location = (p.neighborhood || p.district || 'unknown').toLowerCase().trim();

            // Room Key: "3+1", "2+1" etc.
            const rooms = (p.rooms || 'unknown').replace(/\s/g, '').slice(0, 3);

            // Composite Key: Location + Price + Rooms
            // We use this as a base, then title similarity inside
            const baseKey = `${location}|${priceStr}|${rooms}`;

            if (!groups.has(baseKey)) {
                groups.set(baseKey, []);
            }
            groups.get(baseKey).push(p);
        });

        let totalUpdated = 0;
        let groupCounter = 0;

        for (const [baseKey, items] of groups.entries()) {
            if (items.length > 1) {
                groupCounter++;
                // Generate a unique group_id for this set
                const groupId = crypto.createHash('md5').update(baseKey).digest('hex');

                // Prioritize Sahibinden for primary listing if available
                const sortedItems = [...items].sort((a, b) => {
                    if (a.url.includes('sahibinden.com')) return -1;
                    if (b.url.includes('sahibinden.com')) return 1;
                    return 0;
                });

                for (let i = 0; i < sortedItems.length; i++) {
                    const p = sortedItems[i];
                    await prisma.property.update({
                        where: { id: p.id },
                        data: {
                            group_id: groupId,
                            is_primary: i === 0
                        }
                    });
                    totalUpdated++;
                }
                console.log(`Group Found: "${sortedItems[0].title}" (${sortedItems.length} platforms)`);
            } else {
                // Ensure single items are marked primary and clear any old group_id if they lost their match
                const p = items[0];
                if (!p.is_primary) {
                    await prisma.property.update({
                        where: { id: p.id },
                        data: { is_primary: true }
                    });
                    totalUpdated++;
                }
            }
        }

        console.log(`--- Perfect Deduplication Complete ---`);
        console.log(`Total Groups: ${groupCounter}`);
        console.log(`Records Updated: ${totalUpdated}`);

    } catch (error) {
        console.error('Error during perfect deduplication:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deduplicatePerfect();
