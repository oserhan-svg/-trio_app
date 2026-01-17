const prisma = require('../db');

const findMatches = async (property) => {
    try {
        console.log(`🔍 Checking matches for property: ${property.title} (${property.price} TL)`);

        const price = parseFloat(property.price);

        const demands = await prisma.demand.findMany({
            where: {
                // Price criteria (if defined)
                AND: [
                    {
                        OR: [
                            { min_price: { lte: price } },
                            { min_price: null }
                        ]
                    },
                    {
                        OR: [
                            { max_price: { gte: price } },
                            { max_price: null }
                        ]
                    }
                ]
            },
            include: {
                client: true
            }
        });

        // Filter in memory for more complex string matching (rooms, district)
        // because Prisma/SQL regex support varies across DBs and can be complex.
        const matches = demands.filter(d => {
            // Check District
            if (d.district && property.district) {
                if (!property.district.toLowerCase().includes(d.district.toLowerCase())) return false;
            }

            // Check Neighborhood
            if (d.neighborhood && property.neighborhood) {
                if (!property.neighborhood.toLowerCase().includes(d.neighborhood.toLowerCase())) return false;
            }

            // Check Rooms
            if (d.rooms && property.rooms) {
                // Simple inclusion check. "3+1" matches "3+1"
                if (!property.rooms.includes(d.rooms)) return false;
            }

            return true;
        });

        console.log(`✅ Found ${matches.length} matching demands.`);
        return matches;

    } catch (error) {
        console.error('Match service error:', error);
        return [];
    }
};

module.exports = { findMatches };
