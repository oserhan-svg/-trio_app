const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing duplicate primary listings in groups\n');

    // Find the duplicate in group 0539514e-44a6-4609-b613-e6eb8e96017f
    // ID 6404 is newer (created Jan 22) vs ID 2391 (created Jan 19)
    // We should keep the OLDER one as primary

    console.log('📋 Marking ID 6404 as non-primary (duplicate of ID 2391)...\n');

    const result = await prisma.property.update({
        where: { id: 6404 },
        data: { is_primary: false }
    });

    console.log(`✅ Updated ID ${result.id}: is_primary = ${result.is_primary}`);

    // Verify the fix
    const group = await prisma.property.findMany({
        where: {
            group_id: '0539514e-44a6-4609-b613-e6eb8e96017f'
        },
        select: {
            id: true,
            title: true,
            is_primary: true,
            created_at: true
        }
    });

    console.log('\n📊 Verification - Group 0539514e status:');
    group.forEach(listing => {
        const status = listing.is_primary ? '✅ PRIMARY' : '❌ NON-PRIMARY';
        console.log(`  ID ${listing.id}: ${status} (Created: ${listing.created_at.toISOString().substring(0, 10)})`);
    });

    // Count final active primary listings
    const activeCount = await prisma.property.count({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active',
            is_primary: true
        }
    });

    console.log(`\n🎉 Total visible active Trio listings: ${activeCount}`);
    console.log('Users should now see 6 unique properties in the portfolio.');
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
