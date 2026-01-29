const prisma = require('../db');
const crypto = require('crypto');

/**
 * Identifies and groups duplicate listings of the same property across portals.
 */
const groupProperty = async (propertyId) => {
    try {
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });

        if (!property || !property.neighborhood) {
            return null;
        }

        const size = property.size_m2 ? Number(property.size_m2) : null;
        const price = Number(property.price);
        const isLand = ['land', 'arsa', 'tarla', 'zeytinlik'].includes(property.category?.toLowerCase());

        // 1. Search for potential matches in the database
        const rawMatches = await prisma.property.findMany({
            where: {
                id: { not: propertyId },
                neighborhood: property.neighborhood,
                district: property.district,
                listing_type: property.listing_type,
                ...(!isLand && property.rooms ? { rooms: property.rooms } : {}),
                ...(size ? {
                    size_m2: {
                        gte: size * 0.95, // Wider margin for cross-portal detection
                        lte: size * 1.05
                    }
                } : {}),
                price: {
                    gte: price * 0.85,
                    lte: price * 1.15
                }
            },
            orderBy: { created_at: 'asc' }
        });

        // 2. Fuzzy Title Matching (Jaccard Similarity)
        const getWords = (str) => {
            if (!str) return new Set();
            return new Set(str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
        };

        const currentWords = getWords(property.title);
        const matches = rawMatches.filter(m => {
            const matchWords = getWords(m.title);
            if (currentWords.size === 0 || matchWords.size === 0) return true; // Fallback to basic criteria

            const intersection = new Set([...currentWords].filter(x => matchWords.has(x)));
            const union = new Set([...currentWords, ...matchWords]);
            const similarity = intersection.size / union.size;

            return similarity > 0.3; // Low threshold but enough to filter unrelated ones in same neighborhood/price
        });

        let groupId = null;
        let isPrimary = false;

        if (matches.length > 0) {
            const existingGroupMatch = matches.find(m => m.group_id);
            if (existingGroupMatch) {
                groupId = existingGroupMatch.group_id;
                isPrimary = false;
            } else {
                groupId = crypto.randomUUID();
                const oldest = matches[0];
                await prisma.property.update({
                    where: { id: oldest.id },
                    data: { group_id: groupId, is_primary: true }
                });
                isPrimary = false;
            }
        } else {
            groupId = crypto.randomUUID();
            isPrimary = true;
        }

        const updated = await prisma.property.update({
            where: { id: propertyId },
            data: {
                group_id: groupId,
                is_primary: isPrimary
            }
        });

        return updated;
    } catch (error) {
        console.error('Deduplication Error:', error);
        return null;
    }
};

/**
 * Runs deduplication on all properties that don't have a group_id yet.
 */
const runInitialDeduplication = async () => {
    const ungrouped = await prisma.property.findMany({
        where: { group_id: null }
    });

    console.log(`Running initial deduplication for ${ungrouped.length} properties...`);

    for (const p of ungrouped) {
        await groupProperty(p.id);
        // Add a small delay to prevent DB/CPU spikes
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('Initial deduplication complete.');
};

module.exports = { groupProperty, runInitialDeduplication };
