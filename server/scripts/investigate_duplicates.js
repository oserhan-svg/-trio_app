const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Investigating potential duplicates in detail\n');

    // Get the two suspected duplicates
    const listings = await prisma.property.findMany({
        where: {
            id: { in: [2391, 6404] }
        }
    });

    console.log('📋 Listing Comparison:\n');

    listings.forEach((listing, idx) => {
        console.log(`\n${idx + 1}. ID ${listing.id}:`);
        console.log(`   Title: ${listing.title}`);
        console.log(`   Price: ${listing.price?.toLocaleString()} ₺`);
        console.log(`   Neighborhood: ${listing.neighborhood || 'N/A'}`);
        console.log(`   Rooms: ${listing.rooms || 'N/A'}`);
        console.log(`   Category: ${listing.category || 'N/A'}`);
        console.log(`   URL: ${listing.url}`);
        console.log(`   External ID: ${listing.external_id || 'N/A'}`);
        console.log(`   Listing Type: ${listing.listing_type || 'N/A'}`);
        console.log(`   is_primary: ${listing.is_primary}`);
        console.log(`   group_id: ${listing.group_id || 'N/A'}`);
        console.log(`   Created: ${listing.created_at}`);
    });

    console.log('\n🔍 Analysis:');
    if (listings[0].external_id === listings[1].external_id) {
        console.log('❌ These are TRUE DUPLICATES (same external_id)');
        console.log('   One should be marked is_primary=false');
    } else {
        console.log('✅ These are DIFFERENT listings (different external_id)');
        console.log('   Both should remain visible');
    }
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
