const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function deduplicateFinal() {
    try {
        console.log('--- Starting Final Robust Deduplication ---');

        // Reset all is_primary to true first for assigned properties to start fresh
        await prisma.property.updateMany({
            where: { assigned_user_id: { not: null } },
            data: { is_primary: true, group_id: null }
        });

        const portfolio = await prisma.property.findMany({
            where: { assigned_user_id: { not: null } },
            orderBy: [{ created_at: 'asc' }]
        });

        console.log(`Analyzing ${portfolio.length} portfolio items...`);

        // Helper to normalize strings
        const normalize = (str) => {
            if (!str) return '';
            return str.toLowerCase()
                .replace(/[^a-z0-9]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !['satilik', 'kiralik', 'emlak', 'gayrimenkul', 'ayvalik', 'firsat', 'acik', 'deniz', 'yeni', 'konumda'].includes(w))
                .sort()
                .join('|');
        };

        const processedGroups = [];

        // Nested loops are fine for 38 items
        for (let i = 0; i < portfolio.length; i++) {
            const p1 = portfolio[i];
            let foundMatch = false;

            for (const group of processedGroups) {
                const pRef = group[0];

                // Match Criteria:
                // 1. Exact Price
                const priceMatch = parseFloat(p1.price) === parseFloat(pRef.price);

                // 2. Keyword Similarity (at least 2 matching significant words or identical normalized string)
                const keywords1 = new Set(normalize(p1.title).split('|'));
                const keywordsRef = new Set(normalize(pRef.title).split('|'));

                let matchingKeywords = 0;
                keywords1.forEach(k => { if (keywordsRef.has(k)) matchingKeywords++; });

                const titleMatch = matchingKeywords >= 2 || (keywords1.size === 0 && keywordsRef.size === 0);

                if (priceMatch && titleMatch) {
                    group.push(p1);
                    foundMatch = true;
                    break;
                }
            }

            if (!foundMatch) {
                processedGroups.push([p1]);
            }
        }

        let updateCount = 0;
        for (const group of processedGroups) {
            if (group.length > 1) {
                const groupId = crypto.createHash('md5').update(normalize(group[0].title) + group[0].price).digest('hex');
                console.log(`Matching Group Found (${group.length} items): "${group[0].title}"`);

                // Sort: Sahibinden > Hepsiemlak > Others
                group.sort((a, b) => {
                    if (a.url.includes('sahibinden.com')) return -1;
                    if (b.url.includes('sahibinden.com')) return 1;
                    return 0;
                });

                for (let j = 0; j < group.length; j++) {
                    const p = group[j];
                    await prisma.property.update({
                        where: { id: p.id },
                        data: {
                            group_id: groupId,
                            is_primary: j === 0
                        }
                    });
                    updateCount++;
                }
            } else {
                // Single item, already reset to is_primary = true, group_id = null
            }
        }

        console.log(`--- Deduplication Complete. Groups: ${processedGroups.filter(g => g.length > 1).length}, Updated: ${updateCount} ---`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deduplicateFinal();
