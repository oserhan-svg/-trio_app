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

        if (!property || !property.neighborhood || !property.rooms || !property.size_m2) {
            return null;
        }

        const size = Number(property.size_m2);
        const price = Number(property.price);

        // 1. Search for potential matches in the database
        // Criteria: Same neighborhood, same rooms, similar size (±2%), similar price (±10%)
        const matches = await prisma.property.findMany({
            where: {
                id: { not: propertyId },
                neighborhood: property.neighborhood,
                rooms: property.rooms,
                district: property.district,
                listing_type: property.listing_type,
                size_m2: {
                    gte: size * 0.98,
                    lte: size * 1.02
                },
                // Price can vary slightly between portals or over time
                price: {
                    gte: price * 0.90,
                    lte: price * 1.10
                }
            },
            orderBy: { created_at: 'asc' }
        });

        let groupId = null;
        let isPrimary = false;

        if (matches.length > 0) {
            // Found a match! Use the existing group_id if it exists, otherwise create one
            const existingGroupMatch = matches.find(m => m.group_id);
            if (existingGroupMatch) {
                groupId = existingGroupMatch.group_id;
                isPrimary = false; // The new one is a secondary listing
            } else {
                // No group_id yet, generate a new one and update the first match too
                groupId = crypto.randomUUID();

                // Update the oldest listing as primary
                const oldest = matches[0];
                await prisma.property.update({
                    where: { id: oldest.id },
                    data: { group_id: groupId, is_primary: true }
                });
                isPrimary = false;
            }
        } else {
            // Truly new property (no matches yet)
            groupId = crypto.randomUUID();
            isPrimary = true;
        }

        // 2. Update the current property
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
    }

    console.log('Initial deduplication complete.');
};

module.exports = { groupProperty, runInitialDeduplication };
