
const prisma = require('../db');

async function analyzeDataAccuracy() {
    try {
        console.log('--- Database Integrity Analysis ---');

        const total = await prisma.property.count();
        console.log(`Total Records: ${total}`);

        // 1. Stale Data Analysis
        // Assume listings older than 30 days without updates might be stale
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const staleCount = await prisma.property.count({
            where: {
                last_scraped: { lt: thirtyDaysAgo }
            }
        });
        console.log(`Potential Stale Listings (>30 days not scraped): ${staleCount}`);

        // 2. Cross-Platform Duplication Estimate
        // We will try to match properties based on strict criteria:
        // Same Neighborhood + Same Room Count + Same Price (+/- 5%) + Same Size (+/- 5%)

        const properties = await prisma.property.findMany({
            select: { id: true, url: true, price: true, size_m2: true, rooms: true, neighborhood: true, title: true }
        });

        // Group by strict criteria key
        const potentialMatches = [];
        const processedIds = new Set();

        for (let i = 0; i < properties.length; i++) {
            const p1 = properties[i];
            if (processedIds.has(p1.id)) continue;

            // Only compare if we have basic data
            if (!p1.price || !p1.size_m2 || !p1.neighborhood) continue;

            const group = [p1];
            processedIds.add(p1.id);

            for (let j = i + 1; j < properties.length; j++) {
                const p2 = properties[j];
                if (processedIds.has(p2.id)) continue;

                // Match Logic
                const sameNeighborhood = p1.neighborhood === p2.neighborhood;
                const priceDiff = Math.abs(p1.price - p2.price) / p1.price;
                const sizeDiff = Math.abs(p1.size_m2 - p2.size_m2) / p1.size_m2;
                const sameRooms = p1.rooms === p2.rooms;

                // 2% tolerance for price and size
                if (sameNeighborhood && sameRooms && priceDiff < 0.02 && sizeDiff < 0.05) {
                    group.push(p2);
                    processedIds.add(p2.id);
                }
            }

            if (group.length > 1) {
                // Check if they are from different domains (meaning cross-platform)
                const domains = group.map(p => {
                    if (p.url.includes('sahibinden')) return 'sahibinden';
                    if (p.url.includes('hepsiemlak')) return 'hepsiemlak';
                    if (p.url.includes('emlakjet')) return 'emlakjet';
                    return 'other';
                });

                const uniqueDomains = new Set(domains);
                if (uniqueDomains.size > 1) {
                    potentialMatches.push(group);
                }
            }
        }

        console.log(`Found ${potentialMatches.length} groups of potential CROSS-PLATFORM duplicates.`);
        console.log(`This represents approx ${potentialMatches.length} properties listed on multiple sites.`);

        if (potentialMatches.length > 0) {
            console.log('\nExample Match Group:');
            const exam = potentialMatches[0];
            exam.forEach(p => console.log(`- ${p.title} (${p.price} TL, ${p.size_m2}m2) - ${p.url}`));
        }

        // 3. Seller Overlap
        // Check finding same listings under "Owner" and "Office"
        // (Sometimes owner posts, then gives to office 2 days later)

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeDataAccuracy();
