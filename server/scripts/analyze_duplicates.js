const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Analyzing duplicate Trio listings across platforms\n');

    // Get all active Trio listings
    const activeTrioListings = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active'
        },
        select: {
            id: true,
            title: true,
            price: true,
            url: true,
            neighborhood: true,
            rooms: true,
            category: true
        },
        orderBy: { id: 'asc' }
    });

    console.log(`📊 Total Active Trio Listings: ${activeTrioListings.length}\n`);

    // Group by potential duplicates (same price, neighborhood, rooms)
    const groups = new Map();

    activeTrioListings.forEach(listing => {
        // Create a key based on price, neighborhood, and rooms
        const key = `${listing.price}_${listing.neighborhood}_${listing.rooms}_${listing.category}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(listing);
    });

    // Find actual duplicates (groups with more than 1 listing)
    const duplicates = Array.from(groups.values()).filter(group => group.length > 1);
    const singles = Array.from(groups.values()).filter(group => group.length === 1);

    console.log(`📋 Unique Properties: ${singles.length}`);
    console.log(`🔁 Duplicate Groups: ${duplicates.length}\n`);

    if (duplicates.length > 0) {
        console.log('🔁 DUPLICATE LISTINGS FOUND:\n');
        duplicates.forEach((group, idx) => {
            console.log(`Group ${idx + 1}: ${group[0].title.substring(0, 60)}...`);
            console.log(`  Price: ${group[0].price.toLocaleString()} ₺`);
            console.log(`  Neighborhood: ${group[0].neighborhood || 'N/A'}`);
            console.log(`  Rooms: ${group[0].rooms || 'N/A'}`);
            console.log(`  Platforms:`);
            group.forEach(listing => {
                const platform = listing.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
                console.log(`    - ID ${listing.id} on ${platform} (${listing.url.substring(0, 50)}...)`);
            });
            console.log('');
        });

        console.log('💡 RECOMMENDATION:');
        console.log('These listings should be grouped together and displayed as ONE item');
        console.log('with both platform badges (Sahibinden + Hepsiemlak).\n');
    } else {
        console.log('✅ No duplicates detected - all listings are unique!\n');
    }

    // Analyze by title similarity
    console.log('📝 Analyzing by title similarity...\n');
    const titleGroups = new Map();

    activeTrioListings.forEach(listing => {
        // Normalize title: remove extra spaces, lowercase, remove common words
        const normalizedTitle = listing.title
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/satılık|kiralık|için|daire|villa/gi, '')
            .trim()
            .substring(0, 30); // First 30 chars

        if (!titleGroups.has(normalizedTitle)) {
            titleGroups.set(normalizedTitle, []);
        }
        titleGroups.get(normalizedTitle).push(listing);
    });

    const titleDuplicates = Array.from(titleGroups.values()).filter(group => group.length > 1);

    if (titleDuplicates.length > 0) {
        console.log('🔁 TITLE-BASED DUPLICATES:\n');
        titleDuplicates.forEach((group, idx) => {
            console.log(`Group ${idx + 1}:`);
            group.forEach(listing => {
                const platform = listing.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
                console.log(`  - ID ${listing.id}: ${listing.title.substring(0, 60)}... (${platform})`);
            });
            console.log('');
        });
    }
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
