const prisma = require('../db');

/**
 * Calculates a match score (0-100) between a property and a demand criteria.
 * Weights: 
 * - Price: 40 pts
 * - Neighborhood: 30 pts
 * - Rooms: 20 pts
 * - District: 10 pts
 */
const calculateMatchScore = (property, demand) => {
    let score = 0;
    const reasons = [];

    // 1. Price Score (40 pts)
    const price = parseFloat(property.price);
    if (!demand.min_price && !demand.max_price) {
        score += 40;
    } else {
        const min = demand.min_price || 0;
        const max = demand.max_price || Infinity;

        if (price >= min && price <= max) {
            score += 40; // Perfect match
        } else if (price <= max * 1.05) { // Within 5% flexibility
            score += 30;
            reasons.push('Bütçenin %5 üzerinde');
        } else if (price <= max * 1.10) { // Within 10% flexibility
            score += 15;
            reasons.push('Bütçenin %10 üzerinde');
        }
    }

    // 2. Neighborhood Score (30 pts)
    if (!demand.neighborhood) {
        score += 30; // Broad matches get full points for location if not specified
    } else if (property.neighborhood && property.neighborhood.toLowerCase().includes(demand.neighborhood.toLowerCase())) {
        score += 30;
    } else {
        reasons.push('Mahalle uyumsuz');
    }

    // 3. Rooms Score (20 pts)
    if (!demand.rooms) {
        score += 20;
    } else if (property.rooms && property.rooms.includes(demand.rooms)) {
        score += 20;
    } else {
        reasons.push('Oda sayısı farklı');
    }

    // 4. District Score (10 pts)
    if (!demand.district) {
        score += 10;
    } else if (property.district && property.district.toLowerCase().includes(demand.district.toLowerCase())) {
        score += 10;
    }

    return {
        score,
        isViable: score >= 60, // A "viable" match should have at least 60% compliance
        reasons
    };
};

/**
 * Finds all properties matching a client's demands
 */
const findMatchesForClient = async (clientId) => {
    const client = await prisma.client.findUnique({
        where: { id: parseInt(clientId) },
        include: { demands: true }
    });

    if (!client || !client.demands.length) return [];

    // For efficiency, we fetch all active properties and score them
    // In a massive DB, we'd use filters, but for Ayvalık scale (~5-10k listings), 
    // in-memory scoring allows for sophisticated logic (like 5% budget flexibility).
    const properties = await prisma.property.findMany({
        where: { listing_type: 'sale' }, // Usually matches are for buyers
        orderBy: { created_at: 'desc' },
        take: 200 // Only check latest 200 for speed
    });

    const allMatches = [];

    for (const demand of client.demands) {
        properties.forEach(prop => {
            const { score, isViable, reasons } = calculateMatchScore(prop, demand);
            if (isViable) {
                allMatches.push({
                    ...prop,
                    match_quality: score,
                    match_reasons: reasons
                });
            }
        });
    }

    // Deduplicate and sort by score
    return Array.from(new Map(allMatches.map(p => [p.id, p])).values())
        .sort((a, b) => b.match_quality - a.match_quality);
};

/**
 * Finds all clients matching a single property (used during scraping)
 */
const findMatchesForProperty = async (property) => {
    const activeDemands = await prisma.demand.findMany({
        include: { client: true }
    });

    const matches = [];
    activeDemands.forEach(demand => {
        const { score, isViable } = calculateMatchScore(property, demand);
        if (isViable) {
            matches.push({
                client: demand.client,
                match_quality: score,
                demand_id: demand.id
            });
        }
    });

    return matches;
};

module.exports = { findMatchesForClient, findMatchesForProperty, calculateMatchScore };
