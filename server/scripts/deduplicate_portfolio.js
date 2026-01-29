const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function deduplicatePortfolio() {
    try {
        console.log('--- Starting Portfolio Deduplication ---');

        const portfolio = await prisma.property.findMany({
            where: { assigned_user_id: { not: null } },
            orderBy: { created_at: 'asc' }
        });

        const groups = new Map();

        // 1. Group by title and price
        portfolio.forEach(p => {
            const key = `${p.title.toLowerCase().trim()}|${p.price.toString()}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(p);
        });

        let updatedCount = 0;

        for (const [key, properties] of groups.entries()) {
            if (properties.length > 1) {
                // Determine group_id (consistent hash of the key)
                const groupId = crypto.createHash('md5').update(key).digest('hex');

                // First property is primary, others are not
                for (let i = 0; i < properties.length; i++) {
                    const p = properties[i];
                    const isPrimary = i === 0;

                    await prisma.property.update({
                        where: { id: p.id },
                        data: {
                            group_id: groupId,
                            is_primary: isPrimary
                        }
                    });
                    updatedCount++;
                }
                console.log(`Grouped ${properties.length} listings with Title: "${properties[0].title}"`);
            } else {
                // Ensure single listings are primary
                if (properties[0].is_primary === false || properties[0].group_id === null) {
                    await prisma.property.update({
                        where: { id: properties[0].id },
                        data: { is_primary: true }
                    });
                }
            }
        }

        console.log(`--- Portfolio Deduplication Complete (${updatedCount} properties updated) ---`);
    } catch (error) {
        console.error('Deduplication Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deduplicatePortfolio();
