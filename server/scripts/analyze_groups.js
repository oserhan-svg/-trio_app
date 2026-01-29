const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking group_id usage in active Trio listings\n');

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
            url: true,
            group_id: true,
            is_primary: true,
            external_id: true
        },
        orderBy: { group_id: 'asc' }
    });

    console.log(`📊 Total Active Trio Listings: ${activeTrioListings.length}\n`);

    // Group by group_id
    const groups = new Map();

    activeTrioListings.forEach(listing => {
        const gid = listing.group_id || 'NO_GROUP';
        if (!groups.has(gid)) {
            groups.set(gid, []);
        }
        groups.get(gid).push(listing);
    });

    console.log(`📋 Grouped Listings:\n`);

    groups.forEach((listings, groupId) => {
        if (listings.length > 1) {
            console.log(`\nGroup: ${groupId.substring(0, 8)}...`);
            console.log(`Total: ${listings.length} listings`);
            listings.forEach(listing => {
                const platform = listing.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
                const primaryStatus = listing.is_primary ? '✅ PRIMARY' : '❌ NON-PRIMARY';
                console.log(`  - ID ${listing.id}: ${listing.title.substring(0, 50)}... [${platform}] ${primaryStatus}`);
                console.log(`    External ID: ${listing.external_id}`);
            });

            const primaryCount = listings.filter(l => l.is_primary).length;
            if (primaryCount > 1) {
                console.log(`  ⚠️ WARNING: ${primaryCount} listings marked as primary in this group!`);
            } else if (primaryCount === 0) {
                console.log(`  ⚠️ WARNING: No listing marked as primary in this group!`);
            }
        } else {
            const listing = listings[0];
            const platform = listing.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
            console.log(`\n✅ Standalone: ID ${listing.id} (${platform})`);
            console.log(`   ${listing.title.substring(0, 60)}...`);
        }
    });

    console.log('\n\n💡 RECOMMENDATION:');
    console.log('For grouped listings, ensure ONLY ONE is marked as is_primary=true');
    console.log('The frontend should display grouped listings together with platform badges.');
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
