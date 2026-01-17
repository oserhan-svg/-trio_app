const prisma = require('../db');

/**
 * Compare two strings for fuzzy match (case insensitive)
 */
const isMatch = (source, target) => {
    if (!source || !target) return true; // If criteria missing, assume match (broad search)
    return source.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(source.toLowerCase());
};

const findMatchesForClient = async (clientId) => {
    // 1. Get Client and Demands
    const client = await prisma.client.findUnique({
        where: { id: parseInt(clientId) },
        include: { demands: true }
    });

    if (!client || !client.demands.length) return [];

    let allMatches = [];

    // 2. Iterate each demand
    for (const demand of client.demands) {
        // Build dynamic query
        const where = { AND: [] };

        // Price Criteria (Budget)
        if (demand.max_price) {
            where.AND.push({ price: { lte: demand.max_price } });
        }
        if (demand.min_price) {
            where.AND.push({ price: { gte: demand.min_price } });
        }

        // Location Criteria (Fuzzy)
        // Since SQL 'contains' is simple, we might need a broader fetch and filter in JS if complex,
        // but for now, let's try direct DB filtering for efficiency.
        if (demand.neighborhood) {
            where.AND.push({
                neighborhood: { contains: demand.neighborhood, mode: 'insensitive' }
            });
        }
        if (demand.district) {
            where.AND.push({
                district: { contains: demand.district, mode: 'insensitive' }
            });
        }

        // Room Criteria (Exact text match often fails, so we use contains)
        if (demand.rooms) {
            where.AND.push({
                rooms: { contains: demand.rooms, mode: 'insensitive' }
            });
        }

        // Fetch candidates
        const candidates = await prisma.property.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 50 // Limit matches per demand
        });

        // Add metadata
        const matchesWithScore = candidates.map(p => ({
            ...p,
            matchReason: `Matches budget ${demand.max_price ? '< ' + demand.max_price : ''} and location ${demand.neighborhood || 'Any'}`
        }));

        allMatches = [...allMatches, ...matchesWithScore];
    }

    // Deduplicate by ID
    const uniqueMatches = Array.from(new Map(allMatches.map(item => [item.id, item])).values());

    return uniqueMatches;
};

module.exports = { findMatchesForClient };
