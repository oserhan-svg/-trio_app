const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for cross-platform duplicates (Sahibinden + Hepsiemlak)\n');

    const activeTrioListings = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active',
            is_primary: true
        },
        select: {
            id: true,
            title: true,
            price: true,
            url: true,
            neighborhood: true,
            rooms: true,
            category: true,
            listing_type: true,
            size_m2: true,
            group_id: true
        },
        orderBy: { id: 'asc' }
    });

    console.log(`📊 Total Visible Active Trio Listings: ${activeTrioListings.length}\n`);

    // Separate by platform
    const sahibindenListings = activeTrioListings.filter(l => l.url.includes('sahibinden'));
    const hepsiemlakListings = activeTrioListings.filter(l => l.url.includes('hepsiemlak'));

    console.log(`📋 Platform Breakdown:`);
    console.log(`  Sahibinden: ${sahibindenListings.length}`);
    console.log(`  Hepsiemlak: ${hepsiemlakListings.length}\n`);

    console.log('🔍 Checking for potential cross-platform matches...\n');

    let crossPlatformMatches = [];

    sahibindenListings.forEach(sahib => {
        hepsiemlakListings.forEach(hepsi => {
            // Check if they match on key criteria
            const priceMatch = Math.abs(sahib.price - hepsi.price) < 100; // Allow 100 TL difference
            const neighborhoodMatch = sahib.neighborhood === hepsi.neighborhood;
            const roomsMatch = sahib.rooms === hepsi.rooms;
            const sizeMatch = sahib.size_m2 && hepsi.size_m2 && Math.abs(sahib.size_m2 - hepsi.size_m2) < 5;

            // Calculate similarity score
            let score = 0;
            if (priceMatch) score += 3;
            if (neighborhoodMatch) score += 2;
            if (roomsMatch) score += 2;
            if (sizeMatch) score += 2;

            // Title similarity (fuzzy)
            const titleSimilarity = compareTitles(sahib.title, hepsi.title);
            if (titleSimilarity > 0.6) score += 3;

            if (score >= 5) {
                crossPlatformMatches.push({
                    sahibinden: sahib,
                    hepsiemlak: hepsi,
                    score,
                    priceMatch,
                    neighborhoodMatch,
                    roomsMatch,
                    sizeMatch,
                    titleSimilarity
                });
            }
        });
    });

    if (crossPlatformMatches.length > 0) {
        console.log(`🔁 FOUND ${crossPlatformMatches.length} CROSS-PLATFORM MATCHES:\n`);
        crossPlatformMatches.forEach((match, idx) => {
            console.log(`Match ${idx + 1} (Score: ${match.score}):`);
            console.log(`  Sahibinden ID ${match.sahibinden.id}:`);
            console.log(`    ${match.sahibinden.title.substring(0, 60)}...`);
            console.log(`    Price: ${match.sahibinden.price.toLocaleString()} ₺`);
            console.log(`  Hepsiemlak ID ${match.hepsiemlak.id}:`);
            console.log(`    ${match.hepsiemlak.title.substring(0, 60)}...`);
            console.log(`    Price: ${match.hepsiemlak.price.toLocaleString()} ₺`);
            console.log(`  Match Details:`);
            console.log(`    Price: ${match.priceMatch ? '✅' : '❌'}`);
            console.log(`    Neighborhood: ${match.neighborhoodMatch ? '✅' : '❌'}`);
            console.log(`    Rooms: ${match.roomsMatch ? '✅' : '❌'}`);
            console.log(`    Title Similarity: ${(match.titleSimilarity * 100).toFixed(0)}%`);
            console.log('');
        });

        console.log('💡 RECOMMENDATION:');
        console.log('These cross-platform listings should be grouped together.');
        console.log('Assign them the same group_id and mark one as is_primary=false.\n');
    } else {
        console.log('✅ No cross-platform duplicates detected.');
        console.log('Each property appears on only ONE platform.\n');
    }
}

function compareTitles(title1, title2) {
    const normalize = (str) => str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const t1 = normalize(title1);
    const t2 = normalize(title2);

    // Simple word overlap
    const words1 = new Set(t1.split(' '));
    const words2 = new Set(t2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
